"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { isRateLimited, ADMIN_SESSION_MAX_AGE_SECONDS } from "@/lib/security"
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionCookieOptions,
  getExpectedAdminSessionToken,
  verifyAdminCredentials,
} from "@/lib/admin-auth"

export async function loginAdmin(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
    return { error: "Admin is not configured for this project." }
  }

  if (!email || !password) {
    return { error: "Please enter both email and password." }
  }

  if (isRateLimited(email.toLowerCase())) return { error: "Too many login attempts. Please try again later." }

  const isValid = await verifyAdminCredentials(email, password)
  if (!isValid) {
    return { error: "Incorrect email or password." }
  }

  const token = await getExpectedAdminSessionToken()
  if (!token) {
    return { error: "Admin is not configured for this project." }
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    ...(await getAdminSessionCookieOptions()),
  })

  redirect("/admin/dashboard")
}

export async function logoutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
  redirect("/admin")
}
