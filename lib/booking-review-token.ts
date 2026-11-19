import { createHmac, timingSafeEqual } from "node:crypto"

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

function signature(bookingId: number, expires: number) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return null
  return createHmac("sha256", secret).update(`booking-review:${bookingId}:${expires}`).digest("hex")
}

export function createBookingReviewToken(bookingId: number, now = Date.now()) {
  const expires = now + TOKEN_TTL_MS
  const signed = signature(bookingId, expires)
  return signed ? `${expires}.${signed}` : null
}

export function verifyBookingReviewToken(bookingId: number, token: string | null | undefined, now = Date.now()) {
  if (!token || !Number.isSafeInteger(bookingId)) return false
  const [expiresPart, provided, ...rest] = token.split(".")
  const expires = Number(expiresPart)
  if (!provided || rest.length || !Number.isSafeInteger(expires) || expires < now) return false
  const expected = signature(bookingId, expires)
  if (!expected || provided.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}

export function siteBaseUrl() {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? (production ? `https://${production}` : "https://lotuswellness.app")).replace(/\/$/, "")
}

// Falls back to the admin booking list when no signing secret is configured.
export function adminBookingReviewUrl(bookingId: number) {
  const token = createBookingReviewToken(bookingId)
  return token ? `${siteBaseUrl()}/booking-review/${bookingId}?t=${encodeURIComponent(token)}` : `${siteBaseUrl()}/admin/bookings`
}
