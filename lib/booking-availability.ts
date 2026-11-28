import { and, eq, gt, inArray, lt, ne, sql } from "drizzle-orm"
import type { db } from "@/lib/db"
import { bookings, bookingSettings, therapists } from "@/lib/db/schema"
import { zonedLocalDateTimeToUtc } from "@/lib/timezone"
import { BOOKING_BUFFER_MS, DEFAULT_CLOSE_TIME, DEFAULT_OPEN_TIME, MAX_BOOKING_GUESTS, MIN_BOOKING_NOTICE_MS } from "@/lib/booking-rules"

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Reader = Transaction | typeof db
type Party = { id?: number; therapistId: number | null; guests: number }
type Settings = Pick<typeof bookingSettings.$inferSelect, "openTime" | "closeTime" | "closedWeekdays" | "advanceBookingDays"> & Partial<Pick<typeof bookingSettings.$inferSelect, "maxGuests">>
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
  const open = toMinutes(settings?.openTime ?? DEFAULT_OPEN_TIME)
  const close = toMinutes(settings?.closeTime ?? DEFAULT_CLOSE_TIME)
  const end = close <= open ? close + 1440 : close
  const slots: { time: string; start: Date; end: Date }[] = []
  for (let minutes = Math.ceil(open / 15) * 15; minutes <= 1440 && (close === 0 ? minutes + duration < end : minutes + duration <= end) && minutes < end; minutes += 15) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
    const start = zonedLocalDateTimeToUtc(date, time, timezone)
    if (start.getTime() < now.getTime() + MIN_BOOKING_NOTICE_MS) continue
    slots.push({ time, start, end: new Date(start.getTime() + duration * 60_000) })
  }
  return slots
}

export async function lockBookingSchedule(tx: Transaction) {
  // All public appointment writes serialize their overlap check and write.
  await tx.execute(sql`select pg_advisory_xact_lock(417236, 1)`)
}

export function bookingIntervalsConflict(start: Date, end: Date, otherStart: Date, otherEnd: Date) {
  return start.getTime() < otherEnd.getTime() + BOOKING_BUFFER_MS && end.getTime() > otherStart.getTime() - BOOKING_BUFFER_MS
}

type OccupiedBooking = {
  start: Date
  end: Date
  therapistId: number | null
  guests: number
}
type CapacityBooking = Pick<OccupiedBooking, "therapistId" | "guests">

export function overlappingBookings(reader: Reader, party: Party, start: Date, end: Date) {
  const bufferedStart = new Date(start.getTime() - BOOKING_BUFFER_MS)
  const bufferedEnd = new Date(end.getTime() + BOOKING_BUFFER_MS)
  return reader.select({
    start: bookings.startAt,
    end: bookings.endAt,
    therapistId: bookings.therapistId,
    guests: bookings.guests,
  }).from(bookings).where(and(
    inArray(bookings.status, ["pending", "confirmed"]),
    party.id === undefined ? undefined : ne(bookings.id, party.id),
    lt(bookings.startAt, bufferedEnd),
    gt(bookings.endAt, bufferedStart),
  ))
}

export function hasAvailableTherapistCapacity(
  availableTherapistIds: readonly number[],
  occupiedBookings: readonly CapacityBooking[],
  party: Party,
) {
  const availableTherapists = new Set(availableTherapistIds)
  const assignedTherapists = new Set<number>()
  let unassignedGuestCapacity = 0

  for (const booking of occupiedBookings) {
    if (booking.therapistId !== null && availableTherapists.has(booking.therapistId)) {
      assignedTherapists.add(booking.therapistId)
      unassignedGuestCapacity += Math.max(0, booking.guests - 1)
    } else {
      unassignedGuestCapacity += booking.guests
    }
  }

  if (party.therapistId !== null && !availableTherapists.has(party.therapistId)) return false
  const remainingCapacity = availableTherapists.size - assignedTherapists.size - unassignedGuestCapacity
  return remainingCapacity >= party.guests && (party.therapistId === null || !assignedTherapists.has(party.therapistId))
}

export async function bookingHasAvailableCapacity(reader: Reader, party: Party, start: Date, end: Date) {
  const availableTherapists = await reader.select({ id: therapists.id }).from(therapists).where(and(
    eq(therapists.available, true),
    eq(therapists.visible, true),
  ))
  const occupiedBookings = await overlappingBookings(reader, party, start, end)
  return hasAvailableTherapistCapacity(availableTherapists.map(({ id }) => id), occupiedBookings, party)
}

export async function availableBookingSlots(reader: Reader, booking: Party & { durationMinutes: number; date: string; time: string }, date: string, now: Date) {
  const [settings] = await reader.select().from(bookingSettings).limit(1)
  const maxGuests = Math.min(settings?.maxGuests ?? MAX_BOOKING_GUESTS, MAX_BOOKING_GUESTS)
  if (booking.guests > maxGuests) return []
  const slots = candidateSlots(date, booking.durationMinutes, settings, now)
  const first = slots[0]
  const last = slots.at(-1)
  if (!first || !last) return []
  if (booking.therapistId !== null) {
    const [therapist] = await reader.select({ id: therapists.id }).from(therapists).where(and(eq(therapists.id, booking.therapistId), eq(therapists.available, true), eq(therapists.visible, true))).limit(1)
    if (!therapist) return []
  }
  const availableTherapists = await reader.select({ id: therapists.id }).from(therapists).where(and(
    eq(therapists.available, true),
    eq(therapists.visible, true),
  ))
  const occupied = await overlappingBookings(reader, booking, first.start, last.end)
  return slots.filter((slot) => {
    if (booking.date === date && booking.time === slot.time) return false
    const slotBookings = occupied.filter((old) => bookingIntervalsConflict(slot.start, slot.end, old.start, old.end))
    return hasAvailableTherapistCapacity(availableTherapists.map(({ id }) => id), slotBookings, booking)
  })
}
