import { beforeEach, describe, expect, it, vi } from "vitest"
import { issueBookingConfirmationToken } from "./booking-confirmation-token"

type BookingFixture = {
  id: number
  reference: string
  serviceId: number
  durationMinutes: number
  therapistId: number | null
  date: string
  time: string
  startAt: Date
  endAt: Date
  guests: number
  customerName: string
  email: string
  status: string
  locale: string
  activity: { kind: string; at: string; date: string; time: string }[]
  confirmationTokenHash: string | null
  confirmationTokenExpiresAt: Date | null
  [key: string]: unknown
}

const state = vi.hoisted(() => ({
  booking: null as BookingFixture | null,
  token: "",
  updateCount: 0,
  lookupCount: 0,
  transactionTail: Promise.resolve(),
  capacityAvailable: true,
  lock: vi.fn(async () => undefined),
  sendEmail: vi.fn(async () => true),
}))

vi.mock("@/lib/db", () => {
  const tx = {
    select: () => ({
      from: () => ({
        where: (condition: unknown) => ({
          limit: () => ({
            for: async () => {
              const params = new (await import("drizzle-orm/pg-core")).PgDialect().sqlToQuery(condition as never).params
              const booking = state.booking
              return booking && booking.confirmationTokenHash && params.includes(booking.id) && params.includes(booking.confirmationTokenHash)
                ? [booking]
                : []
            },
          }),
        }),
      }),
    }),
    update: () => ({
      set: (patch: Record<string, unknown>) => ({
        where: () => ({
          returning: async () => {
            if (!state.booking) return []
            state.updateCount += 1
            state.booking = Object.assign({}, state.booking, patch) as BookingFixture
            return [state.booking]
          },
        }),
      }),
    }),
  }

  return {
    db: {
      transaction: async (work: (transaction: typeof tx) => unknown) => {
        const previous = state.transactionTail
        let release: () => void = () => {}
        state.transactionTail = new Promise<void>((resolve) => { release = resolve })
        await previous
        try {
          return await work(tx)
        } finally {
          release()
        }
      },
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              state.lookupCount += 1
              return state.lookupCount % 2 === 1 ? [{ nameEn: "Massage", nameVi: "Mát-xa", nameKo: "마사지" }] : [{ code: "T01" }]
            },
          }),
        }),
      }),
    },
  }
})

vi.mock("@/lib/booking-availability", () => ({
  lockBookingSchedule: state.lock,
  bookingHasAvailableCapacity: async () => state.capacityAvailable,
}))
vi.mock("@/lib/booking-management-email", () => ({ sendBookingManagementEmail: state.sendEmail }))
vi.mock("@/lib/booking-management-locale", () => ({ localizedServiceName: () => "Massage" }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const NOW = new Date("2026-11-27T10:00:00.000Z")

describe("single-use email booking confirmation", () => {
  beforeEach(() => {
    const issued = issueBookingConfirmationToken(NOW)
    state.token = issued.token
    state.booking = {
      id: 42,
      reference: "48271",
      serviceId: 1,
      durationMinutes: 60,
      therapistId: 3,
      date: "2026-12-12",
      time: "10:00",
      startAt: new Date("2026-12-12T03:00:00.000Z"),
      endAt: new Date("2026-12-12T04:00:00.000Z"),
      guests: 1,
      customerName: "Guest",
      email: "guest@example.test",
      status: "pending",
      locale: "en",
      activity: [],
      confirmationTokenHash: issued.hash,
      confirmationTokenExpiresAt: issued.expiresAt,
    }
    state.updateCount = 0
    state.lookupCount = 0
    state.transactionTail = Promise.resolve()
    state.capacityAvailable = true
    state.lock.mockClear()
    state.sendEmail.mockReset().mockResolvedValue(true)
  })

  it("atomically confirms, records the timestamp, invalidates the token, and emails the customer", async () => {
    const { confirmBookingFromEmailToken } = await import("./booking-email-confirmation")
    const result = await confirmBookingFromEmailToken(42, state.token, NOW)

    expect(result).toEqual({ ok: true, customerNotificationSent: true })
    expect(state.booking).toMatchObject({ status: "confirmed", confirmedAt: NOW, confirmationTokenHash: null, confirmationTokenExpiresAt: null })
    expect(state.booking?.activity).toContainEqual({ kind: "confirmed", at: NOW.toISOString(), date: "2026-12-12", time: "10:00" })
    expect(state.updateCount).toBe(1)
    expect(state.lock).toHaveBeenCalledOnce()
    expect(state.sendEmail).toHaveBeenCalledOnce()
  })

  it("does not confirm when capacity is no longer available", async () => {
    state.capacityAvailable = false
    const { confirmBookingFromEmailToken } = await import("./booking-email-confirmation")
    const result = await confirmBookingFromEmailToken(42, state.token, NOW)

    expect(result).toEqual({ ok: false, reason: "unavailable" })
    expect(state.booking?.status).toBe("pending")
    expect(state.updateCount).toBe(0)
    expect(state.sendEmail).not.toHaveBeenCalled()
  })

  it("rejects expired or malformed tokens without changing the booking", async () => {
    const { confirmBookingFromEmailToken } = await import("./booking-email-confirmation")
    state.booking!.confirmationTokenExpiresAt = new Date(NOW.getTime() - 1)
    expect(await confirmBookingFromEmailToken(42, state.token, NOW)).toEqual({ ok: false, reason: "invalid" })
    expect(await confirmBookingFromEmailToken(42, "bad-token", NOW)).toEqual({ ok: false, reason: "invalid" })
    expect(state.booking?.status).toBe("pending")
    expect(state.updateCount).toBe(0)
    expect(state.sendEmail).not.toHaveBeenCalled()
  })

  it("allows only one success for two concurrent clicks and sends one customer email", async () => {
    const { confirmBookingFromEmailToken } = await import("./booking-email-confirmation")
    const results = await Promise.all([
      confirmBookingFromEmailToken(42, state.token, NOW),
      confirmBookingFromEmailToken(42, state.token, NOW),
    ])

    expect(results.filter((result) => result.ok)).toHaveLength(1)
    expect(state.updateCount).toBe(1)
    expect(state.sendEmail).toHaveBeenCalledOnce()
  })
})
