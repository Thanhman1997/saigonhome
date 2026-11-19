"use server"

import { and, eq, gt, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { bookingSettings, bookings, services, therapists } from "@/lib/db/schema"
import { getManagedBookingAccess, hashBookingToken } from "@/lib/booking-management-token"
import { availableBookingSlots, bookingDateRange, lockBookingSchedule } from "@/lib/booking-availability"
import { sendBookingManagementEmail } from "@/lib/booking-management-email"
import { allowBookingRequest } from "@/lib/booking-rate-limit"

const invalid = { ok: false, error: "invalid" } as const
const unavailable = { ok: false, error: "unavailable" } as const
const support = { ok: false, error: "support" } as const

type Booking = typeof bookings.$inferSelect

function authorize(token: unknown) {
  const hash = hashBookingToken(token)
  if (hash) return { where: and(eq(bookings.accessTokenHash, hash), isNull(bookings.accessTokenRevokedAt), gt(bookings.accessTokenExpiresAt, new Date())), locale: undefined }
  const legacy = getManagedBookingAccess(token)
  if (!legacy) return null
  return { where: and(eq(bookings.id, legacy.id), isNull(bookings.accessTokenHash), isNull(bookings.accessTokenRevokedAt)), locale: legacy.locale }
}

function canChange(booking: Booking, now: Date) {
  return (booking.status === "pending" || booking.status === "confirmed") && booking.startAt.getTime() >= now.getTime() + 3_600_000
}
function canCancel(booking: Booking, now: Date) {
  return canChange(booking, now) && booking.paymentStatus === "PENDING_PAYMENT" && !booking.paymentOrderId && !booking.paymentTransactionId
}

async function getSummary(booking: Booking, now: Date) {
  const [[service], [settings], [therapist]] = await Promise.all([
    db.select({ en: services.nameEn, vi: services.nameVi, ko: services.nameKo }).from(services).where(eq(services.id, booking.serviceId)).limit(1),
    db.select().from(bookingSettings).limit(1),
    booking.therapistId ? db.select({ code: therapists.code }).from(therapists).where(eq(therapists.id, booking.therapistId)).limit(1) : [],
  ])
  return {
    reference: booking.reference, customerName: booking.customerName, therapist: therapist?.code ?? null,
    service: service ?? null, date: booking.date, time: booking.time, status: booking.status,
    guests: booking.guests, duration: booking.durationMinutes, total: booking.totalVnd,
    canChange: canChange(booking, now), canCancel: canCancel(booking, now), dates: bookingDateRange(settings, now),
  }
}

export async function readManagedBooking(token: string) {
  const access = authorize(token)
  if (!access || !(await allowBookingRequest("read"))) return invalid
  const [booking] = await db.select().from(bookings).where(access.where).limit(1)
  if (!booking) return invalid
  return { ok: true, booking: await getSummary(booking, new Date()), locale: booking.locale ?? access.locale } as const
}

export async function readManagedBookingSlots(token: string, date: string) {
  const access = authorize(token)
  if (!access || typeof date !== "string" || date.length !== 10 || !(await allowBookingRequest("read"))) return invalid
  const [booking] = await db.select().from(bookings).where(access.where).limit(1)
  const now = new Date()
  if (!booking) return invalid
  if (!canChange(booking, now)) return support
  return { ok: true, times: (await availableBookingSlots(db, booking, date, now)).map((slot) => slot.time) } as const
}

export async function changeManagedBooking(token: string, request: { kind: "cancel" } | { kind: "reschedule"; date: string; time: string }) {
  if (!authorize(token) || !request || (request.kind !== "cancel" && request.kind !== "reschedule") || !(await allowBookingRequest("change"))) return invalid
  if (request.kind === "reschedule" && (typeof request.date !== "string" || request.date.length !== 10 || typeof request.time !== "string" || request.time.length !== 5)) return unavailable

  const result = await db.transaction(async (tx) => {
    await lockBookingSchedule(tx)
    const access = authorize(token)
    if (!access) return invalid
    const [current] = await tx.select().from(bookings).where(access.where).limit(1).for("update")
    if (!current) return invalid
    const now = new Date()
    if (current.accessTokenExpiresAt && current.accessTokenExpiresAt <= now) return invalid
    if (!canChange(current, now)) return support
    const locale = current.locale ?? access.locale ?? "en"
    const history = [...(current.activity ?? [])]
    if (!history.length) history.push({ kind: "created", at: (current.createdAt ?? now).toISOString(), date: current.date, time: current.time })
    if (request.kind === "cancel") {
      if (!canCancel(current, now)) return support
      history.push({ kind: "cancelled", at: now.toISOString(), date: current.date, time: current.time })
      const [updated] = await tx.update(bookings).set({ status: "cancelled", activity: history, locale, updatedAt: now }).where(eq(bookings.id, current.id)).returning()
      return { ok: true, updated, locale, changed: true } as const
    }
    if (request.date === current.date && request.time === current.time) return { ok: true, updated: current, locale, changed: false } as const
    const chosen = (await availableBookingSlots(tx, current, request.date, now)).find((slot) => slot.time === request.time)
    if (!chosen) return unavailable
    history.push({ kind: "rescheduled", at: now.toISOString(), date: request.date, time: chosen.time })
    const [updated] = await tx.update(bookings).set({ date: request.date, time: chosen.time, startAt: chosen.start, endAt: chosen.end, reminderEmailSentAt: null, activity: history, locale, updatedAt: now }).where(eq(bookings.id, current.id)).returning()
    return { ok: true, updated, locale, changed: true } as const
  }).catch(() => unavailable)
  if (!result.ok) return result

  revalidatePath("/admin/bookings")
  const booking = await getSummary(result.updated, new Date())
  const service = booking.service?.[result.locale] || null
  const emailed = !result.changed || await sendBookingManagementEmail(result.updated, service, request.kind === "cancel" ? "cancelled" : "rescheduled", result.locale, {
    therapist: booking.therapist, token: request.kind === "reschedule" && hashBookingToken(token) ? token : undefined,
  })
  return { ok: true, booking, emailed } as const
}
