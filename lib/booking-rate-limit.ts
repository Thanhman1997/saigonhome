import { createHmac } from "node:crypto"
import { headers } from "next/headers"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { clientIpFromHeaders } from "@/lib/client-ip"
import { contactSubmissionRateLimits as limits } from "@/lib/db/schema"

const caps = { create: 12, read: 120, change: 20 }

export async function allowBookingRequest(kind: keyof typeof caps) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const h = await headers()
  const ip = clientIpFromHeaders(h)
  const ipHash = createHmac("sha256", secret).update(`booking:${kind}:${ip}`).digest("hex")
  const now = new Date()
  const cutoff = new Date(+now - 15 * 60 * 1000)
  const [record] = await db.insert(limits).values({ ipHash, windowStartedAt: now, requestCount: 1 }).onConflictDoUpdate({
    target: limits.ipHash,
    set: {
      windowStartedAt: sql`CASE WHEN ${limits.windowStartedAt} < ${cutoff} THEN ${now} ELSE ${limits.windowStartedAt} END`,
      requestCount: sql`CASE WHEN ${limits.windowStartedAt} < ${cutoff} THEN 1 ELSE ${limits.requestCount} + 1 END`,
    },
    setWhere: sql`${limits.windowStartedAt} < ${cutoff} OR ${limits.requestCount} < ${caps[kind]}`,
  }).returning({ count: limits.requestCount })
  return Boolean(record)
}
