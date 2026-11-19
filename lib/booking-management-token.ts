import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { asBookingLocale, type Locale } from "@/lib/booking-management-locale"

const lifetime = 45 * 24 * 60 * 60

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(`lotus-booking-management:v1:${payload}`).digest("base64url")
}

export function createBookingManagementToken(id: number, now = Date.now(), locale?: Locale) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error("Booking management links are not configured")
  const payload = `${id}.${Math.floor(now / 1000) + lifetime}${locale ? `.${locale}` : ""}`
  return `${payload}.${signature(payload, secret)}`
}

export function getManagedBookingAccess(token: unknown, now = Date.now()) {
  const secret = process.env.ADMIN_SECRET
  if (!secret || typeof token !== "string" || token.length > 70) return null
  const match = /^(([1-9]\d{0,9})\.(\d{10,12})(?:\.(en|vi|ko))?)\.([A-Za-z0-9_-]{43})$/.exec(token)
  if (!match) return null
  const [, payload, id, expiry, locale, supplied] = match
  if (Number(id) > 2147483647 || Number(expiry) <= Math.floor(now / 1000)) return null
  const expected = signature(payload, secret)
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)) ? { id: Number(id), locale: asBookingLocale(locale) } : null
}

export function getManagedBookingId(token: unknown, now = Date.now()) {
  return getManagedBookingAccess(token, now)?.id ?? null
}

export function hashBookingToken(token: unknown) {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token) ? createHash("sha256").update(token).digest("hex") : null
}

export function issueBookingToken() {
  const token = randomBytes(32).toString("base64url")
  return { token, hash: hashBookingToken(token)!, expires: new Date(Date.now() + lifetime * 1000) }
}

export function getBookingManagementUrl(access: number | string, locale?: Locale) {
  const url = new URL("/booking/manage", process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://lotuswellness.app")
  if (locale) url.searchParams.set("lang", locale)
  url.hash = `access=${typeof access === "number" ? createBookingManagementToken(access, Date.now(), locale) : access}`
  return url.href
}
