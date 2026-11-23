import { createHmac } from "node:crypto"
import { headers } from "next/headers"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { contactSubmissionRateLimits as limits } from "@/lib/db/schema"

export async function getClientIp(): Promise<string> {
  const h = await headers()
  return h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
}

/**
 * Database-backed fixed-window counter, safe across serverless instances.
 * Returns true when the call is allowed and counts it; false once `limit` is reached in the window.
 */
export async function consumeRateLimit(scope: string, identifier: string, limit: number, windowMs: number): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const keyHash = createHmac("sha256", secret).update(`${scope}:${identifier}`).digest("hex")
  const now = new Date()
  const cutoff = new Date(now.getTime() - windowMs)
  const [record] = await db
    .insert(limits)
    .values({ ipHash: keyHash, windowStartedAt: now, requestCount: 1 })
    .onConflictDoUpdate({
      target: limits.ipHash,
      set: {
        windowStartedAt: sql`CASE WHEN ${limits.windowStartedAt} < ${cutoff} THEN ${now} ELSE ${limits.windowStartedAt} END`,
        requestCount: sql`CASE WHEN ${limits.windowStartedAt} < ${cutoff} THEN 1 ELSE ${limits.requestCount} + 1 END`,
      },
      setWhere: sql`${limits.windowStartedAt} < ${cutoff} OR ${limits.requestCount} < ${limit}`,
    })
    .returning({ count: limits.requestCount })
  return Boolean(record)
}
