import { timingSafeEqual } from "node:crypto"
import type { NextRequest } from "next/server"

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. ADMIN_SECRET is deliberately not accepted so a leaked cron header cannot unlock admin features.
export function hasValidCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization") ?? ""
  if (!secret || !authorization.startsWith("Bearer ")) return false

  const actual = Buffer.from(authorization.slice(7))
  const expected = Buffer.from(secret)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
