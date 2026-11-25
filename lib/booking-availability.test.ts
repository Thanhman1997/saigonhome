import { describe, expect, it } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
import type { SQL } from "drizzle-orm"
import { bookingIntervalsConflict, candidateSlots, overlappingBookings } from "./booking-availability"

describe("midnight booking boundary", () => {
  it("only offers services that finish before midnight", () => {
    const slots = candidateSlots("2026-08-18", 60, {
      openTime: "09:00",
      closeTime: "00:00",
      closedWeekdays: [],
      advanceBookingDays: 30,
    }, new Date("2026-08-17T16:00:00.000Z"))

    expect(slots.at(-1)?.time).toBe("22:45")
    expect(slots.some((slot) => slot.time === "23:00")).toBe(false)
  })
})

describe("therapist booking buffers", () => {
  it("requires a full hour between service intervals in either direction", () => {
    const previousStart = new Date("2026-08-18T09:00:00.000Z")
    const previousEnd = new Date("2026-08-18T10:00:00.000Z")
    const nextStart = new Date("2026-08-18T11:00:00.000Z")
    const nextEnd = new Date("2026-08-18T12:00:00.000Z")

    expect(bookingIntervalsConflict(nextStart, nextEnd, previousStart, previousEnd)).toBe(false)
    expect(bookingIntervalsConflict(new Date("2026-08-18T10:59:00.000Z"), nextEnd, previousStart, previousEnd)).toBe(true)
    expect(bookingIntervalsConflict(previousStart, previousEnd, nextStart, nextEnd)).toBe(false)
    expect(bookingIntervalsConflict(previousStart, new Date("2026-08-18T09:01:00.000Z"), new Date("2026-08-18T10:00:00.000Z"), nextEnd)).toBe(true)
  })

  it("queries the padded window so booking creation cannot bypass the buffer", async () => {
    let condition: SQL | undefined
    const reader = {
      select: () => ({ from: () => ({ where: (value: SQL) => { condition = value; return Promise.resolve([]) } }) }),
    }
    const start = new Date("2026-08-18T10:00:00.000Z")
    const end = new Date("2026-08-18T11:00:00.000Z")

    await overlappingBookings(reader as unknown as Parameters<typeof overlappingBookings>[0], { therapistId: 3, guests: 1 }, start, end)

    const params = new PgDialect().sqlToQuery(condition!).params
    const dateParams = params.map((value) => value instanceof Date ? value.getTime() : typeof value === "string" ? Date.parse(value) : Number.NaN)
    expect(dateParams).toContain(Date.parse("2026-08-18T09:00:00.000Z"))
    expect(dateParams).toContain(Date.parse("2026-08-18T12:00:00.000Z"))
  })
})
