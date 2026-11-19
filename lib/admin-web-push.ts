import "server-only"

import { createECDH, createHmac } from "node:crypto"
import { eq } from "drizzle-orm"
import { sendNotification, type PushSubscription as WebPushSubscription } from "web-push"
import { db } from "@/lib/db"
import { adminPushSubscriptions } from "@/lib/db/schema"

const P256_ORDER = BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551")

type VapidDetails = {
  subject: string
  publicKey: string
  privateKey: string
}

function getVapidDetails(): VapidDetails | null {
  const adminSecret = process.env.ADMIN_SECRET
  const adminEmail = process.env.ADMIN_EMAIL?.trim()
  if (!adminSecret || !adminEmail) return null

  // Domain separation lets Web Push use a stable key without adding another project secret.
  const digest = createHmac("sha256", adminSecret).update("lotus-wellness:web-push:v1").digest()
  const privateScalar = (BigInt(`0x${digest.toString("hex")}`) % (P256_ORDER - BigInt(1))) + BigInt(1)
  const privateKeyBytes = Buffer.from(privateScalar.toString(16).padStart(64, "0"), "hex")
  const ecdh = createECDH("prime256v1")
  ecdh.setPrivateKey(privateKeyBytes)

  return {
    subject: `mailto:${adminEmail}`,
    publicKey: ecdh.getPublicKey(undefined, "uncompressed").toString("base64url"),
    privateKey: privateKeyBytes.toString("base64url"),
  }
}

export function getAdminWebPushPublicKey(): string | null {
  return getVapidDetails()?.publicKey ?? null
}

export async function sendAdminPushNotification(message: { title?: string; body?: string } = {}): Promise<number> {
  const vapidDetails = getVapidDetails()
  if (!vapidDetails) return 0

  const subscriptions = await db
    .select({ endpoint: adminPushSubscriptions.endpoint, p256dh: adminPushSubscriptions.p256dh, auth: adminPushSubscriptions.auth })
    .from(adminPushSubscriptions)

  const payload = JSON.stringify({
    title: message.title?.slice(0, 120) || "New customer message",
    body: message.body?.slice(0, 240) || "A customer sent a message. Open Questions to review it.",
    url: "/admin/questions",
  })

  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
      const pushSubscription: WebPushSubscription = {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      }

      try {
        await sendNotification(pushSubscription, payload, {
          vapidDetails,
          TTL: 60,
          urgency: "high",
        })
        return true
      } catch (error) {
        const statusCode = typeof error === "object" && error !== null && "statusCode" in error
          ? Number(error.statusCode)
          : undefined

        if (statusCode === 404 || statusCode === 410) {
          try {
            await db.delete(adminPushSubscriptions).where(eq(adminPushSubscriptions.endpoint, subscription.endpoint))
          } catch (cleanupError) {
            console.error("[v0] Failed to remove expired admin push subscription:", cleanupError)
          }
        } else {
          console.error("[v0] Failed to send admin Web Push notification:", statusCode ?? "unknown status")
        }
        return false
      }
    }),
  )

  return results.filter(Boolean).length
}
