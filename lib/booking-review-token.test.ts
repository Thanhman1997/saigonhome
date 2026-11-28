import { createHmac } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { adminBookingReviewUrl, createBookingReviewToken, verifyBookingReviewToken } from "./booking-review-token"

beforeEach(() => vi.stubEnv("ADMIN_SECRET", "test-secret"))
afterEach(() => vi.unstubAllEnvs())

const HOUR = 60 * 60 * 1000

describe("booking review token", () => {
  it("accepts a fresh token for the same booking only", () => {
    const token = createBookingReviewToken(7)!
    expect(verifyBookingReviewToken(7, token)).toBe(true)
    expect(verifyBookingReviewToken(8, token)).toBe(false)
  })

  it("rejects expired, tampered, and missing tokens", () => {
    const token = createBookingReviewToken(7, 0)!
    expect(verifyBookingReviewToken(7, token, 8 * 24 * HOUR)).toBe(false)
    expect(verifyBookingReviewToken(7, `${token}0`)).toBe(false)
    expect(verifyBookingReviewToken(7, undefined)).toBe(false)
  })

  it("issues nothing without a signing secret", () => {
    vi.stubEnv("ADMIN_SECRET", "")
    expect(createBookingReviewToken(7)).toBeNull()
  })

  it("binds an action token to its own action", () => {
    const confirm = createBookingReviewToken(7, Date.now(), "confirm")!
    expect(verifyBookingReviewToken(7, confirm, Date.now(), "confirm")).toBe(true)
    expect(verifyBookingReviewToken(7, confirm, Date.now(), "decline-change")).toBe(false)
    expect(verifyBookingReviewToken(7, confirm, Date.now(), "approve-change")).toBe(false)
    expect(verifyBookingReviewToken(7, confirm)).toBe(false)
  })

  it("does not let the email view link authorize an action", () => {
    const view = createBookingReviewToken(7)!
    expect(verifyBookingReviewToken(7, view, Date.now(), "confirm")).toBe(false)
  })

  it("expires action tokens after two hours", () => {
    const token = createBookingReviewToken(7, 0, "confirm")!
    expect(verifyBookingReviewToken(7, token, HOUR, "confirm")).toBe(true)
    expect(verifyBookingReviewToken(7, token, 3 * HOUR, "confirm")).toBe(false)
  })

  it("adds the one-time confirmation token to the review URL without changing the view token", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app")
    const confirmationToken = "a".repeat(43)
    const confirmUrl = new URL(adminBookingReviewUrl(42, confirmationToken, "confirm"))
    const rejectUrl = new URL(adminBookingReviewUrl(42, confirmationToken, "reject"))

    expect(confirmUrl.pathname).toBe("/booking-review/42")
    expect(confirmUrl.searchParams.get("t")).toBeTruthy()
    expect(confirmUrl.searchParams.get("c")).toBe(confirmationToken)
    expect(confirmUrl.searchParams.get("decision")).toBe("confirm")
    expect(rejectUrl.searchParams.get("decision")).toBe("reject")
  })

  it("still opens review links that were emailed before tokens were scoped", () => {
    const expires = Date.now() + HOUR
    const legacy = `${expires}.${createHmac("sha256", "test-secret").update(`booking-review:7:${expires}`).digest("hex")}`
    expect(verifyBookingReviewToken(7, legacy)).toBe(true)
    expect(verifyBookingReviewToken(7, legacy, Date.now(), "confirm")).toBe(false)
  })
})
