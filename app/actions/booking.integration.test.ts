import { beforeEach, describe, expect, it, vi } from "vitest"

const rows = {
  settings: { advanceBookingDays: 30, minNoticeHours: 2, maxGuests: 20, openTime: "09:00", closeTime: "21:00", closedWeekdays: [0] },
  service: { id: 1, nameEn: "Massage", active: true },
  duration: { serviceId: 1, minutes: 60, priceVnd: 500000 },
  therapist: { id: 1, available: true },
}

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => ({
        limit: async () => table === "settings" ? [rows.settings] : table === "services" ? [rows.service] : table === "durations" ? [rows.duration] : table === "therapists" ? [rows.therapist] : [],
        where: () => ({ limit: async () => table === "services" ? [rows.service] : table === "durations" ? [rows.duration] : table === "therapists" ? [rows.therapist] : [] }),
      }),
    }),
    insert: () => ({ values: async (value: Record<string, unknown>) => { insertedBooking.value = value } }),
  },
}))

vi.mock("@/lib/db/schema", () => ({ bookingSettings: "settings", services: "services", serviceDurations: "durations", therapists: "therapists", bookings: "bookings" }))
vi.mock("resend", () => ({ Resend: class { emails = { send: vi.fn().mockResolvedValue({}) } } }))

const insertedBooking = vi.hoisted(() => ({ value: null as Record<string, unknown> | null }))

const localDateString = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-")

const validInput = (date: string, time = "12:00") => ({
  serviceId: 1, durationMinutes: 60, therapistId: 1, guests: 1, date, time,
  customerName: "Test Customer", email: "test@example.com", phone: "0900000000",
  address: "Test address", detailedAddress: "", notes: "", isFirstTime: false,
})

describe("createBooking integration contract", () => {
  beforeEach(() => {
    insertedBooking.value = null
    vi.resetModules()
  })

  it("persists Vietnam local time as the correct UTC instant", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking(validInput("2026-08-18", "10:00"))
      expect(result.success).toBe(true)
      expect(insertedBooking.value?.startAt).toEqual(new Date("2026-08-18T03:00:00.000Z"))
      expect(insertedBooking.value?.endAt).toEqual(new Date("2026-08-18T04:00:00.000Z"))
    } finally {
      vi.useRealTimers()
    }
  })

  it("accepts a valid booking", async () => {
    const { createBooking } = await import("./booking")
    const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
    const result = await createBooking(validInput(date))
    expect(result.success).toBe(true)
  })

  it("rejects a closed weekday", async () => {
    const { createBooking } = await import("./booking")
    const sunday = new Date(Date.now() + 3 * 86400000)
    sunday.setDate(sunday.getDate() + (7 - sunday.getDay()) % 7)
    const result = await createBooking(validInput(localDateString(sunday)))
    expect(result).toMatchObject({ success: false, error: "Selected day is unavailable" })
  })

  it("rejects outside opening hours", async () => {
    const { createBooking } = await import("./booking")
    const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
    const result = await createBooking(validInput(date, "08:00"))
    expect(result).toMatchObject({ success: false, error: "Selected time is unavailable" })
  })

  it("rejects dates beyond the configured advance window", async () => {
    const { createBooking } = await import("./booking")
    const date = new Date(Date.now() + 31 * 86400000).toISOString().slice(0, 10)
    const result = await createBooking(validInput(date))
    expect(result).toMatchObject({ success: false, error: "Selected date is outside the booking window" })
  })

  it("rejects bookings inside the minimum notice window", async () => {
    const { createBooking } = await import("./booking")
    const date = new Date(Date.now() + 1 * 86400000)
    while (date.getDay() === 0) date.setDate(date.getDate() + 1)
    const result = await createBooking(validInput(date.toISOString().slice(0, 10), "00:30"))
    expect(result).toMatchObject({ success: false, error: "Selected time is unavailable" })
  })

  it("rejects malformed date and time values", async () => {
    const { createBooking } = await import("./booking")
    const result = await createBooking(validInput("2026/08/20", "noon"))
    expect(result).toMatchObject({ success: false, error: "Invalid date or time" })
  })
})
