import { timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import {
  exchangeKakaoAuthorizationCode,
  getKakaoConfiguration,
  getKakaoIdentity,
  LOTUS_ADMIN,
  normalizeKoreanPhone,
  saveVerifiedKakaoConnection,
} from "@/lib/kakao"
import { isKakaoAdminAuthenticated } from "@/lib/kakao-admin"
import { requeueBlockedKakaoNotifications } from "@/lib/kakao-notifications"

export const runtime = "nodejs"
const OAUTH_STATE_COOKIE = "lw_kakao_oauth_state"

function clearStateCookie(response: NextResponse): NextResponse {
  response.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/kakao/callback",
    maxAge: 0,
  })
  return response
}

function matchesState(expected: string | undefined, actual: string | null): boolean {
  if (!expected || !actual) return false
  const expectedBytes = Buffer.from(expected)
  const actualBytes = Buffer.from(actual)
  return expectedBytes.length === actualBytes.length && timingSafeEqual(expectedBytes, actualBytes)
}

function redirectAdmin(request: NextRequest, search: string): NextResponse {
  return clearStateCookie(NextResponse.redirect(new URL(search, request.nextUrl.origin)))
}

export async function GET(request: NextRequest) {
  if (!(await isKakaoAdminAuthenticated())) {
    return redirectAdmin(request, "/admin")
  }

  const cookieStore = await cookies()
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value
  const returnedState = request.nextUrl.searchParams.get("state")
  if (!matchesState(expectedState, returnedState)) {
    return redirectAdmin(request, "/admin/kakao?error=state")
  }

  if (request.nextUrl.searchParams.has("error")) {
    return redirectAdmin(request, "/admin/kakao?error=cancelled")
  }

  const code = request.nextUrl.searchParams.get("code")
  if (!code || !getKakaoConfiguration()) {
    return redirectAdmin(request, "/admin/kakao?error=not_configured")
  }

  try {
    const tokens = await exchangeKakaoAuthorizationCode(code)
    const identity = await getKakaoIdentity(tokens.access_token)
    const expectedNickname = LOTUS_ADMIN.name.trim().replace(/\s+/g, " ").toLocaleUpperCase("en-US")
    const actualNickname = identity.nickname.trim().replace(/\s+/g, " ").toLocaleUpperCase("en-US")
    const expectedPhone = normalizeKoreanPhone(LOTUS_ADMIN.phone)
    const actualPhone = normalizeKoreanPhone(identity.phoneNumber)

    if (!identity.userId || actualNickname !== expectedNickname || actualPhone !== expectedPhone) {
      return redirectAdmin(request, "/admin/kakao?error=identity_mismatch")
    }

    await saveVerifiedKakaoConnection({
      userId: identity.userId,
      nickname: identity.nickname,
      phoneNumber: identity.phoneNumber,
      scopes: identity.scopes,
      tokens,
    })
    await requeueBlockedKakaoNotifications()

    return redirectAdmin(request, "/admin/kakao?connected=1")
  } catch {
    return redirectAdmin(request, "/admin/kakao?error=authorization_failed")
  }
}
