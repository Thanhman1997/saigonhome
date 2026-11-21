import { NextRequest, NextResponse } from "next/server"
import {
  consumeKakaoOAuthState,
  exchangeKakaoAuthorizationCode,
  getKakaoConfiguration,
  getKakaoIdentity,
  saveVerifiedKakaoConnection,
} from "@/lib/kakao"
import { processDueKakaoNotifications, requeueBlockedKakaoNotifications } from "@/lib/kakao-notifications"

export const runtime = "nodejs"

function redirectAdmin(origin: string, search: string): NextResponse {
  return NextResponse.redirect(new URL(search, origin))
}

export async function GET(request: NextRequest) {
  const callbackOrigin = request.nextUrl.origin
  const returnedState = request.nextUrl.searchParams.get("state")
  if (!returnedState) {
    return redirectAdmin(callbackOrigin, "/admin/kakao?error=state")
  }

  let oauthState: Awaited<ReturnType<typeof consumeKakaoOAuthState>>
  try {
    oauthState = await consumeKakaoOAuthState(returnedState)
  } catch (error) {
    console.error("[v0] Kakao OAuth state could not be verified:", error)
    return redirectAdmin(callbackOrigin, "/admin/kakao?error=state_storage")
  }

  if (!oauthState) {
    return redirectAdmin(callbackOrigin, "/admin/kakao?error=state")
  }

  // The one-use state is written only after admin authentication and enables safe cross-host callbacks.
  const returnOrigin = oauthState.returnToOrigin
  if (request.nextUrl.searchParams.has("error")) {
    return redirectAdmin(returnOrigin, "/admin/kakao?error=cancelled")
  }

  const code = request.nextUrl.searchParams.get("code")
  if (!code || !getKakaoConfiguration()) {
    return redirectAdmin(returnOrigin, "/admin/kakao?error=not_configured")
  }

  try {
    const tokens = await exchangeKakaoAuthorizationCode(code)
    const identity = await getKakaoIdentity(tokens.access_token)
    if (!identity.userId) return redirectAdmin(returnOrigin, "/admin/kakao?error=authorization_failed")

    await saveVerifiedKakaoConnection({
      userId: identity.userId,
      scopes: identity.scopes,
      tokens,
    })
    await requeueBlockedKakaoNotifications()
    try {
      await processDueKakaoNotifications()
    } catch (error) {
      console.error("[v0] Kakao connected, but pending notifications could not be processed:", error)
    }

    return redirectAdmin(returnOrigin, "/admin/kakao?connected=1")
  } catch (error) {
    console.error("[v0] Kakao OAuth callback failed:", error)
    return redirectAdmin(returnOrigin, "/admin/kakao?error=authorization_failed")
  }
}
