import { beforeEach, describe, expect, it, vi } from "vitest"

const rows = {
  settings: { advanceBookingDays: 30, minNoticeHours: 2, maxGuests: 20, openTime: "09:00", closeTime: "21:00", closedWeekdays: [0] },
  service: { id: 1, nameEn: "Massage", active: true },
  duration: { serviceId: 1, minutes: 60, priceVnd: 500000 },
  therapist: { id: 1, available: true, visible: true },
}

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => ({
        limit: async () => table === "settings" ? [rows.settings] : table === "services" ? [rows.service] : table === "durations" ? [rows.duration] : table === "therapists" ? [rows.therapist] : [],
        where: () => ({ limit: async () => table === "services" ? [rows.service] : table === "durations" ? [rows.duration] : table === "therapists" ? [rows.therapist] : [] }),
      }),
    }),
    transaction: async (work: (tx: unknown) => unknown) => work({
      execute: async () => undefined,
      select: () => ({ from: () => ({ where: async () => conflicts.value }) }),
      insert: () => ({ values: (value: Record<string, unknown>) => ({ returning: async () => {
        insertedBooking.value = value
        return [{ id: 42, email: value.email }]
      } }) }),
    }),
  },
}))

vi.mock("@/lib/db/schema", () => ({ bookingSettings: "settings", services: "services", serviceDurations: "durations", therapists: "therapists", bookings: "bookings" }))
vi.mock("@/lib/booking-rate-limit", () => ({ allowBookingRequest: async () => true }))
vi.mock("@/lib/transactional-email", () => ({ sendTransactionalEmail: async () => false }))

const insertedBooking = vi.hoisted(() => ({ value: null as Record<string, unknown> | null }))
const conflicts = vi.hoisted(() => ({ value: [] as unknown[] }))
const kakaoNotificationMock = vi.hoisted(() => ({ enqueueBooking: vi.fn(async () => undefined) }))

vi.mock("@/lib/kakao-notifications", () => ({ enqueueBookingKakaoNotification: kakaoNotificationMock.enqueueBooking }))

const localDateString = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-")

const validInput = (date: string, time = "12:00") => ({
  serviceId: 1, durationMinutes: 60, therapistId: 1, guests: 1, date, time,
  customerName: "Test Customer", email: "test@example.com", phone: "0900000000",
  address: "Test address", detailedAddress: "", notes: "", isFirstTime: false,
})

describe("createBooking integration contract", () => {
  beforeEach(() => {
    insertedBooking.value = null
    conflicts.value = []
    kakaoNotificationMock.enqueueBooking.mockClear()
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

  it("queues one Kakao notification after a new booking is saved", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking(validInput("2026-08-18", "10:00"))
      expect(result.success).toBe(true)
      expect(kakaoNotificationMock.enqueueBooking).toHaveBeenCalledWith(42)
    } finally {
      vi.useRealTimers()
    }
  })

  it("rejects a slot already held by an active booking", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    conflicts.value = [{}]
    try {
      const { createBooking } = await import("./booking")
      expect(await createBooking(validInput("2026-08-18"))).toMatchObject({ success: false, error: "Selected time is unavailable" })
      expect(insertedBooking.value).toBeNull()
    } finally {
      vi.useRealTimers()
    }
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
    const date = new Date(Date.now() + 3 * 86400000)
    if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1)
    const result = await createBooking(validInput(date.toISOString().slice(0, 10), "08:00"))
    expect(result).toMatchObject({ success: false, error: "Selected time is unavailable" })
  })

  it("rejects dates beyond the configured advance window", async () => {
    const { createBooking } = await import("./booking")
    const date = new Date(Date.now() + 31 * 86400000).toISOString().slice(0, 10)
    const result = await createBooking(validInput(date))
    expect(result).toMatchObject({ success: false, error: "Selected date is outside the booking window" })
  })

  it("accepts a booking exactly one hour ahead in Vietnam time", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T01:00:00.000Z"))
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking(validInput("2026-08-15", "09:00"))
      expect(result.success).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it("rejects a booking less than one hour ahead in Vietnam time", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T01:01:00.000Z"))
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking(validInput("2026-08-15", "09:00"))
      expect(result).toMatchObject({ success: false, error: "Selected time is unavailable" })
    } finally {
      vi.useRealTimers()
    }
  })

  it("rejects times that are not offered on the 15-minute schedule", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking(validInput("2026-08-18", "10:07"))
      expect(result).toMatchObject({ success: false, error: "Invalid date or time" })
      expect(insertedBooking.value).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it("enforces the database guest limit even when older settings allow more", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking({ ...validInput("2026-08-18", "10:00"), guests: 11 })
      expect(result).toMatchObject({ success: false, error: "Invalid number of guests (max 10)" })
      expect(insertedBooking.value).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it("accepts a 17:45 booking when the configured closing time is 01:00", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    rows.settings.closeTime = "01:00"
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking(validInput("2026-08-18", "17:45"))
      expect(result.success).toBe(true)
    } finally {
      rows.settings.closeTime = "21:00"
      vi.useRealTimers()
    }
  })

  it("accepts a 24:00 booking when a 60-minute service ends at 01:00", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    rows.settings.closeTime = "01:00"
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking(validInput("2026-08-18", "24:00"))
      expect(result.success).toBe(true)
      expect(insertedBooking.value?.endAt).toEqual(new Date("2026-08-18T18:00:00.000Z"))
    } finally {
      rows.settings.closeTime = "21:00"
      vi.useRealTimers()
    }
  })

  it("rejects a service that would finish after a midnight closing time", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    rows.settings.closeTime = "00:00"
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking(validInput("2026-08-18", "23:30"))
      expect(result).toMatchObject({ success: false, error: "Selected time is unavailable" })
    } finally {
      rows.settings.closeTime = "21:00"
      vi.useRealTimers()
    }
  })

  it("rejects malformed date and time values", async () => {
    const { createBooking } = await import("./booking")
    const result = await createBooking(validInput("2026/08/20", "noon"))
    expect(result).toMatchObject({ success: false, error: "Invalid date or time" })
  })
})
