import { describe, expect, it } from "vitest"
import { BOOKING_CONFIRMATION_TOKEN_TTL_MS, hashBookingConfirmationToken, issueBookingConfirmationToken } from "./booking-confirmation-token"

describe("one-time booking confirmation tokens", () => {
  it("creates unique random bearer tokens and stores only their hashes", () => {
    const now = new Date("2026-11-27T10:00:00.000Z")
    const first = issueBookingConfirmationToken(now)
    const second = issueBookingConfirmationToken(now)

    expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(first.token).not.toBe(second.token)
    expect(first.hash).toBe(hashBookingConfirmationToken(first.token))
    expect(first.hash).not.toBe(first.token)
    expect(first.expiresAt.getTime()).toBe(now.getTime() + BOOKING_CONFIRMATION_TOKEN_TTL_MS)
  })

  it("rejects malformed tokens before database lookup", () => {
    expect(hashBookingConfirmationToken(undefined)).toBeNull()
    expect(hashBookingConfirmationToken("too-short")).toBeNull()
    expect(hashBookingConfirmationToken("a".repeat(44))).toBeNull()
  })
})
