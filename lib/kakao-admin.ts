import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

export async function isKakaoAdminAuthenticated(): Promise<boolean> {
  const expected = await getExpectedAdminSessionToken()
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  return Boolean(expected) && token === expected
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return false

  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null

  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`)
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null
  } catch {
    return null
  }
}

export function isAllowedKakaoOAuthReturnOrigin(origin: string): boolean {
  let requestedOrigin: URL
  try {
    requestedOrigin = new URL(origin)
  } catch {
    return false
  }

  if (
    process.env.NODE_ENV !== "production" &&
    requestedOrigin.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(requestedOrigin.hostname)
  ) {
    return true
  }

  const configuredOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.KAKAO_REDIRECT_URI,
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.V0_RUNTIME_URL,
    process.env.V0_BUILD_URL,
    process.env.V0_SANDBOX_URL,
  ]
    .map(normalizeOrigin)
    .filter((value): value is string => Boolean(value))

  return configuredOrigins.includes(requestedOrigin.origin)
}
