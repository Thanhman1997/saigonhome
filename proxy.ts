import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/admin") {
    return NextResponse.next()
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value

  if (!(await isValidAdminSession(token))) {
    const loginUrl = new URL("/admin", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
