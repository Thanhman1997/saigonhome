import { beforeEach, describe, expect, it, vi } from "vitest"
import { getAvailableBookingTimes } from "./booking-availability"

const mocks = vi.hoisted(() => ({
  service: { id: 1 } as { id: number } | null,
  duration: { minutes: 60 },
  settings: { maxGuests: 6 },
  slots: vi.fn(),
  allow: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: async () => table === "services" ? [mocks.service] : table === "durations" ? [mocks.duration] : [],
        }),
        limit: async () => table === "settings" ? [mocks.settings] : [],
      }),
    }),
  },
}))
vi.mock("@/lib/db/schema", () => ({ services: "services", serviceDurations: "durations", bookingSettings: "settings" }))
vi.mock("@/lib/booking-rate-limit", () => ({ allowBookingRequest: mocks.allow }))
vi.mock("@/lib/booking-availability", () => ({ availableBookingSlots: mocks.slots }))

const input = { serviceId: 1, durationMinutes: 60, therapistId: 3, guests: 2, date: "2026-08-18" }

beforeEach(() => {
  mocks.service = { id: 1 }
  mocks.duration = { minutes: 60 }
  mocks.settings = { maxGuests: 6 }
  mocks.slots.mockReset().mockResolvedValue([{ time: "10:00" }, { time: "11:00" }])
  mocks.allow.mockReset().mockResolvedValue(true)
})

describe("getAvailableBookingTimes", () => {
  it("returns server-validated open times for the chosen service and therapist", async () => {
    await expect(getAvailableBookingTimes(input)).resolves.toEqual({ ok: true, times: ["10:00", "11:00"], maxGuests: 6 })
    expect(mocks.slots).toHaveBeenCalledWith(
      expect.anything(),
      { therapistId: 3, guests: 2, durationMinutes: 60, date: input.date, time: "" },
      input.date,
      expect.any(Date),
    )
  })

  it("returns no times when the current booking setting limits the party size", async () => {
    await expect(getAvailableBookingTimes({ ...input, guests: 7 })).resolves.toEqual({ ok: true, times: [], maxGuests: 6 })
    expect(mocks.slots).not.toHaveBeenCalled()
  })

  it("rejects malformed and over-limit requests before querying availability", async () => {
    await expect(getAvailableBookingTimes({ ...input, guests: 11 })).resolves.toEqual({ ok: false, error: "unavailable" })
    await expect(getAvailableBookingTimes({ ...input, date: "2026/08/18" })).resolves.toEqual({ ok: false, error: "unavailable" })
    expect(mocks.slots).not.toHaveBeenCalled()
  })

  it("returns an empty schedule for an inactive service or unsupported duration", async () => {
    mocks.service = null
    await expect(getAvailableBookingTimes(input)).resolves.toMatchObject({ ok: true, times: [] })
    expect(mocks.slots).not.toHaveBeenCalled()
  })
})
