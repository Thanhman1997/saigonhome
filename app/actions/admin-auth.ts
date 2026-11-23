"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit"
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  verifyAdminCredentials,
} from "@/lib/admin-auth"

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_LIMIT_PER_IP = 10
const LOGIN_LIMIT_PER_EMAIL = 5

export async function loginAdmin(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
    return { error: "Admin is not configured for this project." }
  }

  if (!email || !password) {
    return { error: "Please enter both email and password." }
  }

  const ip = await getClientIp()
  const [ipAllowed, emailAllowed] = await Promise.all([
    consumeRateLimit("admin-login-ip", ip, LOGIN_LIMIT_PER_IP, LOGIN_WINDOW_MS),
    consumeRateLimit("admin-login-email", email.toLowerCase(), LOGIN_LIMIT_PER_EMAIL, LOGIN_WINDOW_MS),
  ])
  if (!ipAllowed || !emailAllowed) return { error: "Too many login attempts. Please try again later." }

  const isValid = await verifyAdminCredentials(email, password)
  if (!isValid) {
    return { error: "Incorrect email or password." }
  }

  const token = await createAdminSessionToken()
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
