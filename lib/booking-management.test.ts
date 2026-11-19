import { afterEach, describe, expect, it, vi } from "vitest"
import { createBookingManagementToken, getManagedBookingId, getBookingManagementUrl } from "./booking-management-token"
import { createReviewInvitation } from "./review-invitation"
import { candidateSlots } from "./booking-availability"

const now = Date.parse("2026-08-15T01:00:00Z")

afterEach(() => { vi.unstubAllEnvs() })

describe("private booking links", () => {
  it("accepts only an intact, unexpired signature for the assigned booking", () => {
    vi.stubEnv("ADMIN_SECRET", "test-secret")
    const token = createBookingManagementToken(38, now)
    expect(getManagedBookingId(token, now)).toBe(38)
    expect(getManagedBookingId(token.replace(/^38\./, "39."), now)).toBeNull()
    expect(getManagedBookingId(token, now + 45 * 86_400_000)).toBeNull()
    expect(getManagedBookingId("12345", now)).toBeNull()
    expect(getManagedBookingId(createReviewInvitation(38), now)).toBeNull()
  })

  it("does not put access tokens in request URLs", () => {
    vi.stubEnv("ADMIN_SECRET", "test-secret")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com")
    const url = new URL(getBookingManagementUrl(38))
    expect(url.pathname).toBe("/booking/manage")
    expect(url.search).toBe("")
    expect(url.hash).toMatch(/^#access=/)
  })
})

describe("rescheduling time rules", () => {
  const settings = { openTime: "09:00", closeTime: "01:00", closedWeekdays: [0], advanceBookingDays: 30 }
  it("includes only future slots that fit the full service before closing", () => {
    const times = candidateSlots("2026-08-15", 60, settings, new Date(now + 60_000)).map((slot) => slot.time)
    expect(times[0]).toBe("09:15")
    expect(times.at(-1)).toBe("24:00")
    expect(candidateSlots("2026-08-15", 90, settings, new Date(now)).at(-1)?.time).toBe("23:30")
  })

  it("rejects closed days, invalid dates, and dates outside the booking window", () => {
    for (const date of ["2026-08-16", "2026-08-32", "2026-09-16", "2026-08-14"]) {
      expect(candidateSlots(date, 60, settings, new Date(now))).toEqual([])
    }
  })
})
