import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const rows = {
  settings: { advanceBookingDays: 30, minNoticeHours: 2, maxGuests: 20, openTime: "09:00", closeTime: "00:00", closedWeekdays: [0] },
  service: { id: 1, nameEn: "Massage", active: true },
  duration: { serviceId: 1, minutes: 60, priceVnd: 500000 },
  therapist: { id: 1, available: true, visible: true },
  therapists: Array.from({ length: 10 }, (_, index) => ({ id: index + 1 })),
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
      select: () => ({ from: (table: unknown) => ({ where: async () => table === "therapists" ? rows.therapists : conflicts.value }) }),
      insert: () => ({ values: (value: Record<string, unknown>) => ({ returning: async () => {
        const error = databaseErrors.insertQueue.shift()
        if (error) throw Object.assign(new Error("Database constraint violation"), error)
        insertedBooking.value = value
        return [{ id: 42, email: value.email }]
      } }) }),
    }),
  },
}))

vi.mock("@/lib/db/schema", () => ({ bookingSettings: "settings", services: "services", serviceDurations: "durations", therapists: "therapists", bookings: "bookings" }))
vi.mock("@/lib/booking-rate-limit", () => ({ allowBookingRequest: async () => true }))
vi.mock("@/lib/transactional-email", () => ({ sendTransactionalEmail: transactionalEmailMock.send, selectAdminBookingEmailFormat: () => "HTML" }))

const transactionalEmailMock = vi.hoisted(() => ({
  send: vi.fn(async (email: { to: string; subject: string; html: string; text?: string }) => {
    void email
    return false
  }),
}))
const insertedBooking = vi.hoisted(() => ({ value: null as Record<string, unknown> | null }))
const conflicts = vi.hoisted(() => ({ value: [] as unknown[] }))
const databaseErrors = vi.hoisted(() => ({ insertQueue: [] as Array<{ code: string; constraint: string }> }))
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
    vi.spyOn(console, "error").mockImplementation(() => {})
    rows.therapists = Array.from({ length: 10 }, (_, index) => ({ id: index + 1 }))
    insertedBooking.value = null
    conflicts.value = []
    databaseErrors.insertQueue = []
    kakaoNotificationMock.enqueueBooking.mockClear()
    transactionalEmailMock.send.mockClear()
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
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

  it.each([
    ["CASH", "Cash (Tiền mặt)"],
    ["BANK_TRANSFER", "Bank transfer (Chuyển khoản ngân hàng)"],
  ] as const)("includes the customer name and selected %s payment method in the admin email", async (paymentMethod, paymentLabel) => {
    vi.stubEnv("VERCEL_ENV", "preview")
    vi.stubEnv("VERCEL_URL", "saigon-home-preview.vercel.app")
    vi.stubEnv("PREVIEW_SITE_URL", "https://preview.lotuswellness.app")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app")
    vi.stubEnv("ADMIN_SECRET", "test-admin-secret")
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking({ ...validInput("2026-08-18"), customerName: "Test <Customer>", notes: "Please call on arrival", paymentMethod })
      expect(result.success).toBe(true)
      expect(insertedBooking.value?.paymentMethod).toBe(paymentMethod)
      const adminEmail = transactionalEmailMock.send.mock.calls
        .map(([email]) => email)
        .find(({ subject }) => subject.startsWith("New booking — "))
      expect(adminEmail?.html).toContain("Customer name")
      expect(adminEmail?.html).toContain("Test &lt;Customer&gt;")
      expect(adminEmail?.html).toContain(paymentLabel)
      expect(adminEmail?.html).toContain("test@example.com")
      expect(adminEmail?.html).toContain("0900000000")
      expect(adminEmail?.html).toContain("Test address")
      expect(adminEmail?.html).toContain("60 min")
      expect(adminEmail?.html).toContain("Please call on arrival")
      expect(adminEmail?.html).toContain("CONFIRM BOOKING")
      expect(adminEmail?.html).toContain("REJECT BOOKING")
      expect(adminEmail?.html).toContain("without signing in")
      expect(adminEmail?.html).not.toContain("/api/booking-confirmations/confirm")
      expect(adminEmail?.text).toContain("Confirm this booking:")
      expect(adminEmail?.text).toContain("Reject this booking:")
      expect(adminEmail?.text).toContain("https://preview.lotuswellness.app/booking-review/42?t=")
      expect(adminEmail?.html).toContain('href="https://preview.lotuswellness.app/booking-review/42?t=')
      expect(adminEmail?.html).toContain("decision=confirm")
      expect(adminEmail?.html).toContain("decision=reject")
      expect(adminEmail).not.toHaveProperty("amp")
      for (const part of [adminEmail?.text, adminEmail?.html]) {
        expect(part).toContain("preview.lotuswellness.app")
        expect(part).not.toContain(".vercel.app")
      }
      expect(insertedBooking.value).toHaveProperty("confirmationTokenHash")
    } finally {
      vi.useRealTimers()
    }
  })

  it("reports admin email rejection without exposing confirmation credentials", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    transactionalEmailMock.send.mockResolvedValue(false)
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking(validInput("2026-08-18", "10:00"))
      expect(result.success).toBe(true)
      expect(console.error).toHaveBeenCalledWith("Admin booking notification could not be delivered")
      expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toMatch(/[A-Za-z0-9_-]{43}/)
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

  it("retries with a new reference when a generated reference already exists", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    databaseErrors.insertQueue.push({ code: "23505", constraint: "bookings_reference_key" })
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking(validInput("2026-08-18"))
      expect(result.success).toBe(true)
      if (result.success) expect(insertedBooking.value?.reference).toBe(result.reference)
    } finally {
      vi.useRealTimers()
    }
  })

  it("returns an unavailable slot when the database rejects a therapist overlap", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    databaseErrors.insertQueue.push({ code: "23P01", constraint: "bookings_therapist_no_overlap" })
    try {
      const { createBooking } = await import("./booking")
      expect(await createBooking(validInput("2026-08-18"))).toMatchObject({ success: false, error: "Selected time is unavailable" })
      expect(insertedBooking.value).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it("rejects a slot when its selected therapist is already occupied", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    rows.therapists = [{ id: 1 }]
    conflicts.value = [{ therapistId: 1, guests: 1 }]
    try {
      const { createBooking } = await import("./booking")
      expect(await createBooking(validInput("2026-08-18"))).toMatchObject({ success: false, error: "Selected time is unavailable" })
      expect(insertedBooking.value).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it("allows a no-preference booking when another therapist is free", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    rows.therapists = [{ id: 1 }, { id: 2 }]
    conflicts.value = [{ therapistId: 1, guests: 1 }]
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking({ ...validInput("2026-08-18"), therapistId: null })
      expect(result.success).toBe(true)
      expect(insertedBooking.value?.therapistId).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it("reserves capacity for existing unassigned bookings", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    rows.therapists = [{ id: 1 }, { id: 2 }]
    conflicts.value = [{ therapistId: 1, guests: 1 }, { therapistId: null, guests: 1 }]
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking({ ...validInput("2026-08-18"), therapistId: null })
      expect(result).toMatchObject({ success: false, error: "Selected time is unavailable" })
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

  it("accepts a booking exactly 30 minutes ahead in Vietnam time", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T01:30:00.000Z"))
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking(validInput("2026-08-15", "09:00"))
      expect(result.success).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it("rejects a booking less than 30 minutes ahead in Vietnam time", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T01:31:00.000Z"))
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
      rows.settings.closeTime = "00:00"
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
      rows.settings.closeTime = "00:00"
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
      rows.settings.closeTime = "00:00"
      vi.useRealTimers()
    }
  })

  it("rejects a service that would finish exactly at midnight", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T00:00:00.000Z"))
    rows.settings.closeTime = "00:00"
    try {
      const { createBooking } = await import("./booking")
      const result = await createBooking(validInput("2026-08-18", "23:00"))
      expect(result).toMatchObject({ success: false, error: "Selected time is unavailable" })
    } finally {
      rows.settings.closeTime = "00:00"
      vi.useRealTimers()
    }
  })

  it("rejects malformed date and time values", async () => {
    const { createBooking } = await import("./booking")
    const result = await createBooking(validInput("2026/08/20", "noon"))
    expect(result).toMatchObject({ success: false, error: "Invalid date or time" })
  })
})
