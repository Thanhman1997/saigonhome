import { createHash, randomBytes } from "node:crypto"

export const BOOKING_CONFIRMATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export function hashBookingConfirmationToken(token: unknown) {
  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) return null
  return createHash("sha256").update(token).digest("hex")
}

export function issueBookingConfirmationToken(now = new Date()) {
  const token = randomBytes(32).toString("base64url")
  const hash = hashBookingConfirmationToken(token)
  if (!hash) throw new Error("Could not create a booking confirmation token")
  return { token, hash, expiresAt: new Date(now.getTime() + BOOKING_CONFIRMATION_TOKEN_TTL_MS) }
}
