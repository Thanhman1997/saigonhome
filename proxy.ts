import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth"
import { LOCALE_COOKIE, LOCALE_HEADER, LOCALE_PREFIX_PATTERN, asSeoLocale } from "@/lib/seo-constants"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const prefixMatch = pathname.match(LOCALE_PREFIX_PATTERN)
  if (prefixMatch) {
    const locale = asSeoLocale(prefixMatch[1])
    const rest = pathname.slice(prefixMatch[0].length) || "/"
    // Private and API routes are never served under a language prefix.
    if (rest === "/admin" || rest.startsWith("/admin/") || rest === "/api" || rest.startsWith("/api/")) {
      return NextResponse.redirect(new URL(`${rest}${request.nextUrl.search}`, request.url))
    }
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set(LOCALE_HEADER, locale ?? "en")
    const url = request.nextUrl.clone()
    url.pathname = rest
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    if (locale) response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
    return response
  }

  if (pathname === "/admin") {
    return NextResponse.next()
  }

  if (!(await verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value))) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/(en|vi|ko)", "/(en|vi|ko)/:path*"],
}
