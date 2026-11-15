import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { processDueKakaoNotifications } from "@/lib/kakao-notifications"

export const runtime = "nodejs"

function hasValidCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET ?? process.env.ADMIN_SECRET
  const authorization = request.headers.get("authorization") ?? ""
  if (!secret || !authorization.startsWith("Bearer ")) return false

  const actual = Buffer.from(authorization.slice(7))
  const expected = Buffer.from(secret)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export async function GET(request: NextRequest) {
  if (!hasValidCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await processDueKakaoNotifications()
  return NextResponse.json(result)
}
