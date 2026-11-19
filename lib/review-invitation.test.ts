import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createReviewInvitation, getInvitedBookingId } from "./review-invitation"

describe("review invitations", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SECRET", "review-invitation-test-secret")
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-11-19T05:00:00Z"))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  it("identifies the invited booking without contact information", () => {
    expect(getInvitedBookingId(createReviewInvitation(42))).toBe(42)
  })

  it("rejects plain references and modified invitations", () => {
    const [, expiry, signature] = createReviewInvitation(42).split(".")
    expect(getInvitedBookingId("42")).toBeNull()
    expect(getInvitedBookingId(`43.${expiry}.${signature}`)).toBeNull()
    expect(getInvitedBookingId(`42.${Number(expiry) + 1}.${signature}`)).toBeNull()
  })

  it("rejects invitations after 30 days", () => {
    const invitation = createReviewInvitation(42)
    vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000)
    expect(getInvitedBookingId(invitation)).toBeNull()
  })
})
