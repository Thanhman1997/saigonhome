import { describe, expect, it } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
import type { SQL } from "drizzle-orm"
import { bookingIntervalsConflict, candidateSlots, hasAvailableTherapistCapacity, overlappingBookings } from "./booking-availability"

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

  it("ends a 90-minute service at 22:15 when closing at midnight", () => {
    const slots = candidateSlots("2026-08-18", 90, {
      openTime: "09:00",
      closeTime: "00:00",
      closedWeekdays: [],
      advanceBookingDays: 30,
    }, new Date("2026-08-17T16:00:00.000Z"))

    expect(slots.at(-1)?.time).toBe("22:15")
  })
})

describe("opening hours 09:00 to 01:00", () => {
  const settings = { openTime: "09:00", closeTime: "01:00", closedWeekdays: [], advanceBookingDays: 30 }
  const earlyMorning = new Date("2026-08-17T16:00:00.000Z")

  it("offers every 15 minutes from 09:00", () => {
    const slots = candidateSlots("2026-08-18", 60, settings, earlyMorning)
    expect(slots[0]?.time).toBe("09:00")
    expect(slots[1]?.time).toBe("09:15")
    expect(slots[2]?.time).toBe("09:30")
  })

  it("lets a 60-minute service start as late as 24:00 and end at 01:00", () => {
    expect(candidateSlots("2026-08-18", 60, settings, earlyMorning).at(-1)?.time).toBe("24:00")
    expect(candidateSlots("2026-08-18", 90, settings, earlyMorning).at(-1)?.time).toBe("23:30")
  })

  it("requires at least 30 minutes of notice", () => {
    const firstSlot = (now: string) => candidateSlots("2026-08-18", 60, settings, new Date(now))[0]?.time
    expect(firstSlot("2026-08-18T02:00:00.000Z")).toBe("09:30")
    expect(firstSlot("2026-08-18T02:01:00.000Z")).toBe("09:45")
  })
})

describe("available therapist capacity", () => {
  it("keeps no-preference slots open while at least one of ten therapists is free", () => {
    const bookings = [1, 2, 3].map((therapistId) => ({ therapistId, guests: 1 }))
    expect(hasAvailableTherapistCapacity(
      Array.from({ length: 10 }, (_, index) => index + 1),
      bookings,
      { therapistId: null, guests: 1 },
    )).toBe(true)
  })

  it("prevents a selected therapist from being double-booked", () => {
    const bookings = [{ therapistId: 1, guests: 1 }]
    expect(hasAvailableTherapistCapacity([1, 2], bookings, { therapistId: 1, guests: 1 })).toBe(false)
    expect(hasAvailableTherapistCapacity([1, 2], bookings, { therapistId: 2, guests: 1 })).toBe(true)
    expect(hasAvailableTherapistCapacity([2], [], { therapistId: 1, guests: 1 })).toBe(false)
  })

  it("counts unassigned bookings against remaining therapist capacity", () => {
    const bookings = [{ therapistId: 1, guests: 1 }, { therapistId: null, guests: 1 }]
    expect(hasAvailableTherapistCapacity([1, 2], bookings, { therapistId: null, guests: 1 })).toBe(false)
  })

  it("reserves one available therapist per guest", () => {
    expect(hasAvailableTherapistCapacity([1, 2], [], { therapistId: null, guests: 3 })).toBe(false)
  })
})

describe("therapist service intervals", () => {
  it("frees a therapist the moment the previous service ends", () => {
    const previousStart = new Date("2026-08-18T09:00:00.000Z")
    const previousEnd = new Date("2026-08-18T10:00:00.000Z")
    const nextStart = new Date("2026-08-18T10:00:00.000Z")
    const nextEnd = new Date("2026-08-18T11:00:00.000Z")

    expect(bookingIntervalsConflict(nextStart, nextEnd, previousStart, previousEnd)).toBe(false)
    expect(bookingIntervalsConflict(new Date("2026-08-18T09:59:00.000Z"), nextEnd, previousStart, previousEnd)).toBe(true)
    expect(bookingIntervalsConflict(previousStart, previousEnd, nextStart, nextEnd)).toBe(false)
    expect(bookingIntervalsConflict(previousStart, new Date("2026-08-18T10:01:00.000Z"), nextStart, nextEnd)).toBe(true)
  })

  it("queries exactly the service window so booking creation cannot double-book", async () => {
    let condition: SQL | undefined
    const reader = {
      select: () => ({ from: () => ({ where: (value: SQL) => { condition = value; return Promise.resolve([]) } }) }),
    }
    const start = new Date("2026-08-18T10:00:00.000Z")
    const end = new Date("2026-08-18T11:00:00.000Z")

    await overlappingBookings(reader as unknown as Parameters<typeof overlappingBookings>[0], { therapistId: 3, guests: 1 }, start, end)

    const params = new PgDialect().sqlToQuery(condition!).params
    const dateParams = params.map((value) => value instanceof Date ? value.getTime() : typeof value === "string" ? Date.parse(value) : Number.NaN)
    expect(dateParams).toContain(start.getTime())
    expect(dateParams).toContain(end.getTime())
    expect(dateParams).not.toContain(Date.parse("2026-08-18T09:00:00.000Z"))
    expect(dateParams).not.toContain(Date.parse("2026-08-18T12:00:00.000Z"))
  })
})
