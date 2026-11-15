import { NextResponse } from "next/server"
import { isKakaoAdminAuthenticated, isSameOriginRequest } from "@/lib/kakao-admin"
import { processDueKakaoNotifications, retryFailedKakaoNotifications, sendKakaoTestNotification } from "@/lib/kakao-notifications"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!(await isKakaoAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  const body = await request.json().catch(() => null) as { action?: string } | null
  if (body?.action === "test") {
    const result = await sendKakaoTestNotification()
    return NextResponse.json(result, { status: result.status === "sent" ? 200 : result.status === "blocked" ? 409 : 502 })
  }

  if (body?.action === "retry") {
    const reset = await retryFailedKakaoNotifications()
    const result = await processDueKakaoNotifications()
    return NextResponse.json({ reset, ...result })
  }

  return NextResponse.json({ error: "Unsupported notification action" }, { status: 400 })
}
