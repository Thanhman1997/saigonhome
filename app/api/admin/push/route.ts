import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { adminPushSubscriptions } from "@/lib/db/schema"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"
import { sendAdminPushNotification } from "@/lib/admin-web-push"

export const runtime = "nodejs"

async function isAdminAuthenticated() {
  const expected = await getExpectedAdminSessionToken()
  const cookieStore = await cookies()
  return Boolean(expected && cookieStore.get(ADMIN_SESSION_COOKIE)?.value === expected)
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return false

  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

function isValidEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()
    const trustedPushHost =
      hostname === "fcm.googleapis.com" ||
      hostname === "push.services.mozilla.com" ||
      hostname.endsWith(".push.services.mozilla.com") ||
      hostname === "web.push.apple.com" ||
      hostname.endsWith(".push.apple.com") ||
      hostname === "notify.windows.com" ||
      hostname.endsWith(".notify.windows.com") ||
      hostname === "push.opera.com" ||
      hostname.endsWith(".push.samsungosp.com")

    return url.protocol === "https:" && !url.username && !url.password && !url.port && trustedPushHost
  } catch {
    return false
  }
}

function isValidKey(value: unknown, minLength: number): value is string {
  return typeof value === "string" && value.length >= minLength && value.length <= 256 && /^[A-Za-z0-9_-]+$/.test(value)
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  const payload = body as Record<string, unknown>

  if (payload.action === "test") {
    const sent = await sendAdminPushNotification({
      title: "Test notification",
      body: "Web Push is enabled on this device.",
    })
    if (sent === 0) return NextResponse.json({ error: "No active devices are subscribed yet." }, { status: 409 })
    return NextResponse.json({ sent })
  }

  if (payload.action !== "subscribe") return NextResponse.json({ error: "Unsupported action" }, { status: 400 })

  const subscription = payload.subscription
  if (!subscription || typeof subscription !== "object") {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  const candidate = subscription as Record<string, unknown>
  const keys = candidate.keys as Record<string, unknown> | undefined
  if (
    !isValidEndpoint(candidate.endpoint) ||
    !keys ||
    !isValidKey(keys.p256dh, 40) ||
    !isValidKey(keys.auth, 16)
  ) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  try {
    await db
      .insert(adminPushSubscriptions)
      .values({ endpoint: candidate.endpoint, p256dh: keys.p256dh, auth: keys.auth })
      .onConflictDoUpdate({
        target: adminPushSubscriptions.endpoint,
        set: { p256dh: keys.p256dh, auth: keys.auth, createdAt: new Date() },
      })
    return NextResponse.json({ subscribed: true })
  } catch {
    return NextResponse.json({ error: "Could not save this device subscription." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const endpoint = body && typeof body === "object" ? (body as Record<string, unknown>).endpoint : undefined
  if (!isValidEndpoint(endpoint)) return NextResponse.json({ error: "Invalid subscription endpoint" }, { status: 400 })

  try {
    await db.delete(adminPushSubscriptions).where(eq(adminPushSubscriptions.endpoint, endpoint))
    return NextResponse.json({ subscribed: false })
  } catch {
    return NextResponse.json({ error: "Could not remove this device subscription." }, { status: 500 })
  }
}
