import { createHmac, timingSafeEqual } from "node:crypto"

const lifetime = 45 * 24 * 60 * 60

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(`lotus-booking-management:v1:${payload}`).digest("base64url")
}

export function createBookingManagementToken(id: number, now = Date.now()) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error("Booking management links are not configured")
  const payload = `${id}.${Math.floor(now / 1000) + lifetime}`
  return `${payload}.${signature(payload, secret)}`
}

export function getManagedBookingId(token: unknown, now = Date.now()) {
  const secret = process.env.ADMIN_SECRET
  if (!secret || typeof token !== "string" || token.length > 70) return null
  const match = /^([1-9]\d{0,9})\.(\d{10,12})\.([A-Za-z0-9_-]{43})$/.exec(token)
  if (!match) return null
  const [, id, expiry, supplied] = match
  if (Number(id) > 2147483647 || Number(expiry) <= Math.floor(now / 1000)) return null
  const expected = signature(`${id}.${expiry}`, secret)
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)) ? Number(id) : null
}

export function getBookingManagementUrl(id: number) {
  const url = new URL("/booking/manage", process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://lotuswellness.app")
  url.hash = `access=${createBookingManagementToken(id)}`
  return url.href
}
