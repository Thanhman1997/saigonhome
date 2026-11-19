import { and, eq, gt, inArray, isNull, lt, ne, or, sql } from "drizzle-orm"
import type { db } from "@/lib/db"
import { bookings, bookingSettings, therapists } from "@/lib/db/schema"
import { zonedLocalDateTimeToUtc } from "@/lib/timezone"

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Reader = Transaction | typeof db
type Party = { id?: number; therapistId: number | null; guests: number }
type Settings = Pick<typeof bookingSettings.$inferSelect, "openTime" | "closeTime" | "closedWeekdays" | "advanceBookingDays">
const timezone = "Asia/Ho_Chi_Minh"
const dateFormatter = new Intl.DateTimeFormat("sv-SE", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" })

export function bookingDateRange(settings: Settings | undefined, now: Date) {
  const min = dateFormatter.format(now)
  const end = new Date(`${min}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() + (settings?.advanceBookingDays ?? 30))
  return { min, max: end.toISOString().slice(0, 10) }
}

export function candidateSlots(date: string, duration: number, settings: Settings | undefined, now: Date) {
  const bounds = bookingDateRange(settings, now)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < bounds.min || date > bounds.max) return []
  const calendar = new Date(`${date}T00:00:00Z`)
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== date || settings?.closedWeekdays.includes(calendar.getUTCDay())) return []

  const toMinutes = (value: string) => {
    const [hour, minute] = value.split(":").map(Number)
    return hour * 60 + minute
  }
  const open = toMinutes(settings?.openTime ?? "09:00")
  const close = toMinutes(settings?.closeTime ?? "21:00")
  const end = close <= open ? close + 1440 : close
  const slots: { time: string; start: Date; end: Date }[] = []
  for (let minutes = Math.ceil(open / 15) * 15; minutes <= 1440 && minutes + duration <= end && minutes < end; minutes += 15) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
    const start = zonedLocalDateTimeToUtc(date, time, timezone)
    if (start.getTime() < now.getTime() + 3_600_000) continue
    slots.push({ time, start, end: new Date(start.getTime() + duration * 60_000) })
  }
  return slots
}

export async function lockBookingSchedule(tx: Transaction) {
  // All public appointment writes serialize their overlap check and write.
  await tx.execute(sql`select pg_advisory_xact_lock(417236, 1)`)
}

export function overlappingBookings(reader: Reader, party: Party, start: Date, end: Date) {
  return reader.select({ start: bookings.startAt, end: bookings.endAt }).from(bookings).where(and(
    inArray(bookings.status, ["pending", "confirmed"]),
    party.id === undefined ? undefined : ne(bookings.id, party.id),
    lt(bookings.startAt, end), gt(bookings.endAt, start),
    party.therapistId !== null && party.guests === 1
      ? or(eq(bookings.therapistId, party.therapistId), isNull(bookings.therapistId), gt(bookings.guests, 1))
      : undefined,
  ))
}

export async function availableBookingSlots(reader: Reader, booking: Party & { durationMinutes: number; date: string; time: string }, date: string, now: Date) {
  const [settings] = await reader.select().from(bookingSettings).limit(1)
  const slots = candidateSlots(date, booking.durationMinutes, settings, now)
  const first = slots[0]
  const last = slots.at(-1)
  if (!first || !last) return []
  if (booking.therapistId !== null) {
    const [therapist] = await reader.select({ id: therapists.id }).from(therapists).where(and(eq(therapists.id, booking.therapistId), eq(therapists.available, true), eq(therapists.visible, true))).limit(1)
    if (!therapist) return []
  }
  const occupied = await overlappingBookings(reader, booking, first.start, last.end)
  return slots.filter((slot) => !(booking.date === date && booking.time === slot.time) && !occupied.some((old) => old.start < slot.end && old.end > slot.start))
}
