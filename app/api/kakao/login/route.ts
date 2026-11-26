import { randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createKakaoAuthorizationUrl, createKakaoOAuthState, getKakaoConfiguration } from "@/lib/kakao"
import { isAllowedKakaoOAuthReturnOrigin, isKakaoAdminAuthenticated } from "@/lib/kakao-admin"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  if (!(await isKakaoAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  if (!getKakaoConfiguration()) {
    return NextResponse.redirect(new URL("/admin/kakao?error=not_configured", request.url))
  }

  const returnToOrigin = request.nextUrl.origin
  if (!isAllowedKakaoOAuthReturnOrigin(returnToOrigin)) {
    return NextResponse.redirect(new URL("/admin/kakao?error=return_origin", request.url))
  }

  const state = randomBytes(32).toString("base64url")
  try {
    await createKakaoOAuthState(state, returnToOrigin)
  } catch (error) {
    console.error("[v0] Kakao OAuth state could not be stored:", error)
    return NextResponse.redirect(new URL("/admin/kakao?error=state_storage", request.url))
  }

  return NextResponse.redirect(createKakaoAuthorizationUrl(state))
}
