import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { createKakaoAuthorizationUrl, getKakaoConfiguration } from "@/lib/kakao"
import { isKakaoAdminAuthenticated } from "@/lib/kakao-admin"

export const runtime = "nodejs"
const OAUTH_STATE_COOKIE = "lw_kakao_oauth_state"

export async function GET(request: Request) {
  if (!(await isKakaoAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  if (!getKakaoConfiguration()) {
    return NextResponse.redirect(new URL("/admin/kakao?error=not_configured", request.url))
  }

  const state = randomBytes(32).toString("base64url")
  const response = NextResponse.redirect(createKakaoAuthorizationUrl(state))
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/kakao/callback",
    maxAge: 10 * 60,
  })
  return response
}
