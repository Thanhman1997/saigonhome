import { describe, expect, it } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
import type { SQL } from "drizzle-orm"
import { bookingIntervalsConflict, overlappingBookings } from "./booking-availability"

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
