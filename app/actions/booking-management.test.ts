import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
import type { SQL } from "drizzle-orm"
import { createBookingManagementToken, issueBookingToken } from "@/lib/booking-management-token"
import { changeManagedBooking, readManagedBooking, readManagedBookingSlots } from "./booking-management"

const mocks = vi.hoisted(() => ({ select: vi.fn(), transaction: vi.fn(), update: vi.fn(), slots: vi.fn(), email: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/booking-rate-limit", () => ({ allowBookingRequest: async () => true }))
vi.mock("@/lib/db", () => ({ db: { select: mocks.select, transaction: mocks.transaction } }))
vi.mock("@/lib/booking-availability", () => ({ availableBookingSlots: mocks.slots, bookingDateRange: () => ({ min: "2026-08-15", max: "2026-09-14" }), lockBookingSchedule: vi.fn() }))
vi.mock("@/lib/booking-management-email", () => ({ sendBookingManagementEmail: mocks.email }))

const record = {
  id: 1, reference: "12345", email: "private@example.com", serviceId: 1, therapistId: null, durationMinutes: 60,
  date: "2026-08-18", time: "10:00", guests: 1, totalVnd: 500000, status: "confirmed", startAt: new Date("2026-08-18T03:00:00Z"),
  paymentStatus: "PENDING_PAYMENT", paymentOrderId: null, paymentTransactionId: null,
}
let booking: typeof record & { locale?: "ko" | "vi" | "en" }
const token = (id = 1) => createBookingManagementToken(id)

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-08-15T00:00:00Z"))
  vi.stubEnv("ADMIN_SECRET", "fixture-secret")
  booking = { ...record }
  const select = (projection?: object) => ({
    from: () => ({
      where: () => ({ limit: () => Object.assign(Promise.resolve(projection ? [{ en: "Massage", vi: "Massage", ko: "마사지" }] : [booking]), { for: async () => [booking] }) }),
      limit: async () => [],
    }),
  })
  mocks.select.mockImplementation(select)
  mocks.update.mockImplementation((patch) => ({ where: () => ({ returning: async () => [{ ...booking, ...patch }] }) }))
  mocks.transaction.mockImplementation(async (callback) => callback({ select, update: () => ({ set: mocks.update }) }))
  mocks.email.mockResolvedValue(true)
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })

describe("booking management actions", () => {
  it("rejects invalid access before any database operation", async () => {
    expect(await readManagedBooking("12345")).toEqual({ ok: false, error: "invalid" })
    expect(await readManagedBookingSlots("12345", "2026-08-18")).toEqual({ ok: false, error: "invalid" })
    expect(await changeManagedBooking("12345", { kind: "cancel" })).toEqual({ ok: false, error: "invalid" })
    expect(mocks.select).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it("updates the existing appointment only if the new time is available", async () => {
    const request = { kind: "reschedule", date: "2026-08-19", time: "11:00" } as const
    mocks.slots.mockResolvedValueOnce([])
    expect(await changeManagedBooking(token(), request)).toEqual({ ok: false, error: "unavailable" })
    expect(mocks.update).not.toHaveBeenCalled()
    mocks.slots.mockResolvedValueOnce([{ time: "11:00", start: new Date("2026-08-19T04:00:00Z"), end: new Date("2026-08-19T05:00:00Z") }])
    expect(await changeManagedBooking(token(), request)).toMatchObject({ ok: true, booking: { reference: "12345", date: "2026-08-19", time: "11:00" } })
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ reminderEmailSentAt: null, date: request.date }))
  })

  it("looks up only the opaque token hash and requires a non-revoked, unexpired match", async () => {
    const issued = issueBookingToken()
    const query = vi.fn((filter: SQL) => {
      const { sql, params } = new PgDialect().sqlToQuery(filter)
      expect(sql).toContain('"access_token_hash" =')
      expect(sql).toContain('"access_token_revoked_at" is null')
      expect(sql).toContain('"access_token_expires_at" >')
      expect(params).toContain(issued.hash)
      expect(params).not.toContain(issued.token)
      return { limit: async () => [] }
    })
    mocks.select.mockReturnValueOnce({ from: () => ({ where: query }) })
    expect(await readManagedBooking(issued.token)).toEqual({ ok: false, error: "invalid" })
    expect(query).toHaveBeenCalledOnce()
  })

  it("rejects self-service cancellation for paid bookings", async () => {
    booking = { ...record, paymentStatus: "PAID" }
    expect(await changeManagedBooking(token(), { kind: "cancel" })).toEqual({ ok: false, error: "support" })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it.each(["en", "ko", "vi"] as const)("returns stored %s regardless of website locale for a new link", async (locale) => {
    booking = { ...record, locale }
    expect(await readManagedBooking(issueBookingToken().token)).toMatchObject({ ok: true, locale })
  })

  it("uses the signed locale for summaries and emails without exposing the customer address", async () => {
    const localizedToken = createBookingManagementToken(1, Date.now(), "ko")
    expect(await readManagedBooking(localizedToken)).toMatchObject({ ok: true, locale: "ko" })
    const result = await changeManagedBooking(localizedToken, { kind: "cancel" })
    expect(result).toMatchObject({ ok: true, booking: { status: "cancelled", canCancel: false } })
    expect(JSON.stringify(result)).not.toContain(record.email)
    expect(mocks.email).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 1 }), "마사지", "cancelled", "ko", { therapist: null, token: undefined })
  })
})
