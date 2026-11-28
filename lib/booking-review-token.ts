import { createHmac, timingSafeEqual } from "node:crypto"
import { getEmailSiteUrl } from "@/lib/site-url"

// "view" is the link in the admin email. The other tokens are minted by the review page for a single action
// and cannot be exchanged for another action or for viewing the page.
export type ReviewTokenAction = "view" | "confirm" | "approve-change" | "decline-change"

const TOKEN_TTL_MS: Record<ReviewTokenAction, number> = {
  view: 7 * 24 * 60 * 60 * 1000,
  confirm: 2 * 60 * 60 * 1000,
  "approve-change": 2 * 60 * 60 * 1000,
  "decline-change": 2 * 60 * 60 * 1000,
}

function sign(payload: string) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return null
  return createHmac("sha256", secret).update(payload).digest("hex")
}

const payload = (action: ReviewTokenAction, bookingId: number, expires: number) => `booking-review:${action}:${bookingId}:${expires}`
// Links already delivered by email were signed before tokens were scoped; they stay valid for viewing only.
const legacyViewPayload = (bookingId: number, expires: number) => `booking-review:${bookingId}:${expires}`

export function createBookingReviewToken(bookingId: number, now = Date.now(), action: ReviewTokenAction = "view") {
  const expires = now + TOKEN_TTL_MS[action]
  const signed = sign(payload(action, bookingId, expires))
  return signed ? `${expires}.${signed}` : null
}

function matches(provided: string, expected: string | null) {
  return Boolean(expected) && provided.length === expected!.length && timingSafeEqual(Buffer.from(provided), Buffer.from(expected!))
}

export function verifyBookingReviewToken(bookingId: number, token: string | null | undefined, now = Date.now(), action: ReviewTokenAction = "view") {
  if (!token || !Number.isSafeInteger(bookingId)) return false
  const [expiresPart, provided, ...rest] = token.split(".")
  const expires = Number(expiresPart)
  if (!provided || rest.length || !Number.isSafeInteger(expires) || expires < now) return false
  if (matches(provided, sign(payload(action, bookingId, expires)))) return true
  return action === "view" && matches(provided, sign(legacyViewPayload(bookingId, expires)))
}

export function siteBaseUrl() {
  return getEmailSiteUrl()
}

// Falls back to the admin booking list when no signing secret is configured.
export function adminBookingReviewUrl(bookingId: number, confirmationToken?: string, decision?: "confirm" | "reject") {
  const token = createBookingReviewToken(bookingId)
  if (!token) return `${siteBaseUrl()}/admin/bookings`

  const url = new URL(`/booking-review/${bookingId}`, siteBaseUrl())
  url.searchParams.set("t", token)
  if (confirmationToken && /^[A-Za-z0-9_-]{43}$/.test(confirmationToken)) {
    url.searchParams.set("c", confirmationToken)
  }
  if (decision) url.searchParams.set("decision", decision)
  return url.href
}
