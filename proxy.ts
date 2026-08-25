import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/admin") {
    return NextResponse.next()
  }

  const expected = await getExpectedAdminSessionToken()
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value

  if (!expected || token !== expected) {
    const loginUrl = new URL("/admin", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
