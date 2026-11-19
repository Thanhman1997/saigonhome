"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { bookingSettings, bookings, services } from "@/lib/db/schema"
import { getManagedBookingAccess, getManagedBookingId } from "@/lib/booking-management-token"
import { availableBookingSlots, bookingDateRange, lockBookingSchedule } from "@/lib/booking-availability"
import { sendBookingManagementEmail } from "@/lib/booking-management-email"

const invalid = { ok: false, error: "invalid" } as const
const unavailable = { ok: false, error: "unavailable" } as const
const support = { ok: false, error: "support" } as const

type Booking = typeof bookings.$inferSelect
function canChange(booking: Booking, now: Date) {
  return (booking.status === "pending" || booking.status === "confirmed") && booking.startAt.getTime() >= now.getTime() + 3_600_000
}
function canCancel(booking: Booking, now: Date) {
  return canChange(booking, now) && booking.paymentStatus === "PENDING_PAYMENT" && !booking.paymentOrderId && !booking.paymentTransactionId
}

async function getSummary(booking: Booking, now: Date) {
  const [[service], [settings]] = await Promise.all([
    db.select({ en: services.nameEn, vi: services.nameVi, ko: services.nameKo }).from(services).where(eq(services.id, booking.serviceId)).limit(1),
    db.select().from(bookingSettings).limit(1),
  ])
  return {
    reference: booking.reference, service: service ?? null, date: booking.date, time: booking.time, status: booking.status,
    guests: booking.guests, duration: booking.durationMinutes, total: booking.totalVnd,
    canChange: canChange(booking, now), canCancel: canCancel(booking, now), dates: bookingDateRange(settings, now),
  }
}

export async function readManagedBooking(token: string) {
  const access = getManagedBookingAccess(token)
  if (!access) return invalid
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, access.id)).limit(1)
  if (!booking) return invalid
  return { ok: true, booking: await getSummary(booking, new Date()), locale: access.locale } as const
}

export async function readManagedBookingSlots(token: string, date: string) {
  const id = getManagedBookingId(token)
  if (!id || typeof date !== "string" || date.length !== 10) return invalid
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
  const now = new Date()
  if (!booking) return invalid
  if (!canChange(booking, now)) return support
  return { ok: true, times: (await availableBookingSlots(db, booking, date, now)).map((slot) => slot.time) } as const
}

export async function changeManagedBooking(token: string, request: { kind: "cancel" } | { kind: "reschedule"; date: string; time: string }) {
  const access = getManagedBookingAccess(token)
  if (!access || !request || (request.kind !== "cancel" && request.kind !== "reschedule")) return invalid
  const { id, locale } = access
  if (request.kind === "reschedule" && (typeof request.date !== "string" || request.date.length !== 10 || typeof request.time !== "string" || request.time.length !== 5)) return unavailable

  const result = await db.transaction(async (tx) => {
    await lockBookingSchedule(tx)
    const [current] = await tx.select().from(bookings).where(eq(bookings.id, id)).limit(1).for("update")
    if (!current || getManagedBookingId(token) !== id) return invalid
    const now = new Date()
    if (!canChange(current, now)) return support
    if (request.kind === "cancel") {
      if (!canCancel(current, now)) return support
      const [updated] = await tx.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, id)).returning()
      return { ok: true, updated } as const
    }
    const chosen = (await availableBookingSlots(tx, current, request.date, now)).find((slot) => slot.time === request.time)
    if (!chosen) return unavailable
    const [updated] = await tx.update(bookings).set({ date: request.date, time: chosen.time, startAt: chosen.start, endAt: chosen.end, reminderEmailSentAt: null }).where(eq(bookings.id, id)).returning()
    return { ok: true, updated } as const
  })
  if (!result.ok) return result

  revalidatePath("/admin/bookings")
  const booking = await getSummary(result.updated, new Date())
  const service = booking.service?.[locale ?? "en"] || booking.service?.en || null
  const emailed = await sendBookingManagementEmail(result.updated, service, request.kind === "cancel" ? "cancelled" : "rescheduled", locale)
  return { ok: true, booking, emailed } as const
}
