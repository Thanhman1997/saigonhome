import { createHmac, timingSafeEqual } from "node:crypto"

const inviteLifetimeSeconds = 30 * 24 * 60 * 60

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(`booking-review:v1:${payload}`).digest()
}

export function createReviewInvitation(bookingId: number) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error("Review invitations are not configured")

  const expiresAt = Math.floor(Date.now() / 1000) + inviteLifetimeSeconds
  const payload = `${bookingId}.${expiresAt}`
  return `${payload}.${sign(payload, secret).toString("base64url")}`
}

export function getInvitedBookingId(token: string): number | null {
  const secret = process.env.ADMIN_SECRET
  if (!secret || token.length > 80) return null

  const match = /^([1-9][0-9]{0,9})\.([0-9]{10,12})\.([A-Za-z0-9_-]{43})$/.exec(token)
  if (!match) return null

  const [, id, expiry, signature] = match
  const bookingId = Number(id)
  if (bookingId > 2_147_483_647 || Number(expiry) <= Math.floor(Date.now() / 1000)) return null

  const expected = sign(`${id}.${expiry}`, secret)
  const received = Buffer.from(signature, "base64url")
  return received.length === expected.length && timingSafeEqual(received, expected) ? bookingId : null
}
