import { NextRequest, NextResponse } from "next/server"
import { hasValidCronSecret } from "@/lib/cron-auth"
import { processDueKakaoNotifications } from "@/lib/kakao-notifications"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  if (!hasValidCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await processDueKakaoNotifications()
  return NextResponse.json(result)
}
