import { NextResponse } from "next/server"
import { isKakaoAdminAuthenticated, isSameOriginRequest } from "@/lib/kakao-admin"
import { disconnectKakaoAccount } from "@/lib/kakao-notifications"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!(await isKakaoAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  await disconnectKakaoAccount()
  return NextResponse.json({ success: true })
}
