import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createBookingReviewToken, verifyBookingReviewToken } from "./booking-review-token"

beforeEach(() => vi.stubEnv("ADMIN_SECRET", "test-secret"))
afterEach(() => vi.unstubAllEnvs())

describe("booking review token", () => {
  it("accepts a fresh token for the same booking only", () => {
    const token = createBookingReviewToken(7)!
    expect(verifyBookingReviewToken(7, token)).toBe(true)
    expect(verifyBookingReviewToken(8, token)).toBe(false)
  })

  it("rejects expired, tampered, and missing tokens", () => {
    const token = createBookingReviewToken(7, 0)!
    expect(verifyBookingReviewToken(7, token, 8 * 24 * 60 * 60 * 1000)).toBe(false)
    expect(verifyBookingReviewToken(7, `${token}0`)).toBe(false)
    expect(verifyBookingReviewToken(7, undefined)).toBe(false)
  })

  it("issues nothing without a signing secret", () => {
    vi.stubEnv("ADMIN_SECRET", "")
    expect(createBookingReviewToken(7)).toBeNull()
  })
})
