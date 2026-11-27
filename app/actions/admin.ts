"use server"

import { db } from "@/lib/db"
import { bookings, reviews, services, siteContent, therapists } from "@/lib/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import { sendBookingManagementEmail } from "@/lib/booking-management-email"
import { availableBookingSlots, bookingHasAvailableCapacity, lockBookingSchedule } from "@/lib/booking-availability"
import { pendingChangeRequest } from "@/lib/booking-change-request"
import { verifyBookingReviewToken, type ReviewTokenAction } from "@/lib/booking-review-token"
import { canTransitionBookingStatus, isBookingStatus, type BookingStatus } from "@/lib/booking-status"
import { revalidatePath } from "next/cache"
import { assertAdmin } from "@/lib/admin-auth"
import { issueBookingToken } from "@/lib/booking-management-token"
import { localizedServiceName } from "@/lib/booking-management-locale"
import { confirmBookingFromEmailToken as confirmOneTimeBooking, rejectBookingFromEmailToken as rejectOneTimeBooking } from "@/lib/booking-email-confirmation"
import { sendBookingReviewInvitation } from "@/lib/booking-review-invitation-email"

export async function updateBookingStatus(id: number, status: BookingStatus) {
  await assertAdmin()
  return applyBookingStatus(id, status)
}

async function applyBookingStatus(id: number, status: BookingStatus, actor: "admin" | "admin_email" = "admin") {
  if (!isBookingStatus(status)) throw new Error("Invalid status")
  const [booking] = await db.select({ booking: bookings, service: services, therapist: therapists }).from(bookings).leftJoin(services, eq(bookings.serviceId, services.id)).leftJoin(therapists, eq(bookings.therapistId, therapists.id)).where(eq(bookings.id, id)).limit(1)
  if (!booking) throw new Error("Booking not found")
  const current = booking.booking
  if (!canTransitionBookingStatus(current.status, status)) throw new Error(`A ${current.status} booking cannot be changed to ${status}`)
  const access = status === "confirmed" && current.status !== "confirmed" ? issueBookingToken() : null
  await db.transaction(async (tx) => {
    await lockBookingSchedule(tx)
    if ((status === "confirmed" || status === "pending") && !["pending", "confirmed"].includes(current.status)) {
      if (!(await bookingHasAvailableCapacity(tx, current, current.startAt, current.endAt))) throw new Error("This time is no longer available")
    }
    const now = new Date()
    const activity = status === current.status ? current.activity : [...current.activity, { kind: status, at: now.toISOString(), date: current.date, time: current.time, actor }]
    const [updated] = await tx.update(bookings).set({
      status,
      activity,
      updatedAt: now,
      confirmedAt: status === "confirmed" ? current.confirmedAt ?? now : status === "pending" ? null : current.confirmedAt,
      confirmationTokenHash: status === "pending" ? current.confirmationTokenHash : null,
      confirmationTokenExpiresAt: status === "pending" ? current.confirmationTokenExpiresAt : null,
      ...(access && { accessTokenHash: access.hash, accessTokenExpiresAt: access.expires, accessTokenRevokedAt: null }),
      ...(status === "rejected" && { accessTokenHash: null, accessTokenExpiresAt: null, accessTokenRevokedAt: now }),
    }).where(and(
      eq(bookings.id, id), eq(bookings.status, current.status), eq(bookings.startAt, current.startAt),
    )).returning({ id: bookings.id })
    if (!updated) throw new Error("The booking changed. Refresh and try again.")
  })
  if ((status === "confirmed" || status === "cancelled" || status === "rejected") && current.status !== status) {
    const [template] = await db.select().from(siteContent).where(eq(siteContent.key, `booking_${status}_email`)).limit(1)
    const locale = current.locale ?? "en"
    await sendBookingManagementEmail({ ...current, status }, localizedServiceName(booking.service, locale), status, locale, {
      therapist: booking.therapist?.code,
      token: access?.token,
      template: template ? { en: template.valueEn, vi: template.valueVi, ko: template.valueKo }[locale] : null,
    })
  }
  const reviewEmailSent = status === "completed" && current.status !== "completed" ? await sendBookingReviewInvitation(current) : null
  revalidatePath("/admin/bookings")
  revalidatePath("/admin/dashboard")
  return { reviewEmailSent }
}

export async function markBookingPaid(id: number) {
  await assertAdmin()
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) throw new Error("Invalid booking")
  const [updated] = await db.update(bookings)
    .set({ paymentStatus: "PAID", paymentConfirmedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(bookings.id, id), eq(bookings.paymentStatus, "PENDING_PAYMENT"), inArray(bookings.status, ["confirmed", "completed"])))
    .returning({ id: bookings.id })
  revalidatePath("/admin/bookings")
  revalidatePath("/admin/dashboard")
  return { updated: Boolean(updated) }
}

export async function resendBookingReviewInvitation(id: number) {
  await assertAdmin()
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) throw new Error("Invalid booking")
  const [booking] = await db.select({ id: bookings.id, locale: bookings.locale, email: bookings.email, reference: bookings.reference }).from(bookings).where(and(eq(bookings.id, id), eq(bookings.status, "completed"))).limit(1)
  return booking ? sendBookingReviewInvitation(booking) : false
}

export async function approveBookingChange(id: number) {
  await assertAdmin()
  return applyBookingChange(id)
}

async function applyBookingChange(id: number) {
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) throw new Error("Invalid booking")
  const access = issueBookingToken()
  const applied = await db.transaction(async (tx) => {
    await lockBookingSchedule(tx)
    const [current] = await tx.select().from(bookings).where(eq(bookings.id, id)).limit(1).for("update")
    if (!current) throw new Error("Booking not found")
    const request = pendingChangeRequest(current.activity)
    if (!request || !["pending", "confirmed"].includes(current.status)) throw new Error("There is no pending change request")
    const now = new Date()
    const activity = [...current.activity]
    if (request.kind === "cancel") {
      activity.push({ kind: "cancelled", at: now.toISOString(), date: current.date, time: current.time })
      const [updated] = await tx.update(bookings).set({ status: "cancelled", activity, updatedAt: now, confirmationTokenHash: null, confirmationTokenExpiresAt: null }).where(eq(bookings.id, id)).returning()
      return { updated, kind: "cancelled" as const }
    }
    const slot = (await availableBookingSlots(tx, current, request.date, now)).find((candidate) => candidate.time === request.time)
    if (!slot) throw new Error("The requested time is no longer available")
    activity.push({ kind: "rescheduled", at: now.toISOString(), date: request.date, time: slot.time })
    const [updated] = await tx.update(bookings).set({ date: request.date, time: slot.time, startAt: slot.start, endAt: slot.end, reminderEmailSentAt: null, activity, updatedAt: now, accessTokenHash: access.hash, accessTokenExpiresAt: access.expires, accessTokenRevokedAt: null }).where(eq(bookings.id, id)).returning()
    return { updated, kind: "rescheduled" as const }
  })

  const [service] = await db.select().from(services).where(eq(services.id, applied.updated.serviceId)).limit(1)
  const [therapist] = applied.updated.therapistId ? await db.select({ code: therapists.code }).from(therapists).where(eq(therapists.id, applied.updated.therapistId)).limit(1) : []
  const [template] = applied.kind === "cancelled" ? await db.select().from(siteContent).where(eq(siteContent.key, "booking_cancelled_email")).limit(1) : []
  const locale = applied.updated.locale ?? "en"
  const emailed = await sendBookingManagementEmail(applied.updated, localizedServiceName(service, locale), applied.kind, locale, {
    therapist: therapist?.code,
    token: applied.kind === "rescheduled" ? access.token : undefined,
    template: template ? { en: template.valueEn, vi: template.valueVi, ko: template.valueKo }[locale] : null,
  })
  revalidatePath("/admin/bookings")
  return { emailed }
}

export async function declineBookingChange(id: number) {
  await assertAdmin()
  return rejectBookingChange(id)
}

async function rejectBookingChange(id: number) {
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) throw new Error("Invalid booking")
  await db.transaction(async (tx) => {
    await lockBookingSchedule(tx)
    const [current] = await tx.select().from(bookings).where(eq(bookings.id, id)).limit(1).for("update")
    if (!current || !pendingChangeRequest(current.activity)) throw new Error("There is no pending change request")
    const activity = [...current.activity, { kind: "change_declined", at: new Date().toISOString(), date: current.date, time: current.time }]
    await tx.update(bookings).set({ activity, updatedAt: new Date() }).where(eq(bookings.id, id))
  })
  revalidatePath("/admin/bookings")
}

function assertReviewToken(id: number, token: string, action: ReviewTokenAction) {
  if (!verifyBookingReviewToken(id, token, Date.now(), action)) throw new Error("Unauthorized")
}

export async function confirmBookingFromEmail(id: number, token: string) {
  assertReviewToken(id, token, "confirm")
  const [current] = await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, id)).limit(1)
  if (current?.status !== "pending") throw new Error("This booking is no longer waiting for confirmation")
  await applyBookingStatus(id, "confirmed", "admin_email")
}

export async function confirmBookingWithOneTimeToken(id: number, token: string) {
  return confirmOneTimeBooking(id, token)
}

export async function rejectBookingWithOneTimeToken(id: number, token: string) {
  return rejectOneTimeBooking(id, token)
}

export async function approveBookingChangeFromEmail(id: number, token: string) {
  assertReviewToken(id, token, "approve-change")
  return applyBookingChange(id)
}

export async function declineBookingChangeFromEmail(id: number, token: string) {
  assertReviewToken(id, token, "decline-change")
  return rejectBookingChange(id)
}

export async function resendBookingManagementLink(id: number) {
  await assertAdmin()
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) return false
  if (!process.env.RESEND_API_KEY) return false
  const access = issueBookingToken()
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(bookings).where(eq(bookings.id, id)).limit(1).for("update")
    if (!current || !["pending", "confirmed"].includes(current.status) || +current.startAt <= Date.now()) return false
    const [service] = await tx.select().from(services).where(eq(services.id, current.serviceId)).limit(1)
    const [therapist] = current.therapistId ? await tx.select({ code: therapists.code }).from(therapists).where(eq(therapists.id, current.therapistId)).limit(1) : []
    const locale = current.locale ?? "en"
    const sent = await sendBookingManagementEmail(current, localizedServiceName(service, locale), "link", locale, { token: access.token, therapist: therapist?.code })
    if (!sent) return false
    await tx.update(bookings).set({ accessTokenHash: access.hash, accessTokenExpiresAt: access.expires, accessTokenRevokedAt: null }).where(eq(bookings.id, id))
    return true
  }).then((sent) => {
    if (sent) revalidatePath("/admin/bookings")
    return sent
  })
}

export async function revokeBookingManagementLink(id: number) {
  await assertAdmin()
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) return
  await db.update(bookings).set({ accessTokenRevokedAt: new Date() }).where(eq(bookings.id, id))
  revalidatePath("/admin/bookings")
}

export async function saveBookingEmailTemplate(formData: FormData) {
  await assertAdmin()
  const kind = formData.get("kind") === "cancelled" ? "cancelled" : "confirmed"
  const subject = String(formData.get("subject") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  if (!subject || !body) throw new Error("Subject and body are required")
  const valueEn = `${subject}\n${body}`
  await db.insert(siteContent).values({ key: `booking_${kind}_email`, valueEn, valueKo: "", valueVi: "" }).onConflictDoUpdate({ target: siteContent.key, set: { valueEn, updatedAt: new Date() } })
  revalidatePath("/admin/email-templates")
}

export async function toggleReviewApproval(id: number, approved: boolean) {
  await assertAdmin()
  await db.update(reviews).set({ approved }).where(eq(reviews.id, id))
  revalidatePath("/admin/reviews")
  revalidatePath("/reviews")
  revalidatePath("/")
}

export async function deleteReview(id: number) {
  await assertAdmin()
  await db.delete(reviews).where(eq(reviews.id, id))
  revalidatePath("/admin/reviews")
  revalidatePath("/reviews")
  revalidatePath("/")
}

export type ReviewEditInput = {
  customerName: string
  commentEn: string
  commentKo: string
  commentVi: string
  adminReply: string
}

export async function updateReview(id: number, input: ReviewEditInput) {
  await assertAdmin()
  const customerName = input.customerName.trim()
  if (!customerName || customerName.length > 120) throw new Error("Customer name is required")
  const clean = (value: string) => {
    const text = value.trim()
    if (text.length > 2000) throw new Error("Text is too long (max 2000 characters)")
    return text || null
  }
  const commentEn = clean(input.commentEn)
  const commentKo = clean(input.commentKo)
  const commentVi = clean(input.commentVi)
  const adminReply = clean(input.adminReply)

  const [current] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1)
  if (!current) throw new Error("Review not found")
  const textChanged = commentEn !== (current.commentEn ?? null) || commentKo !== (current.commentKo ?? null) || commentVi !== (current.commentVi ?? null) || customerName !== current.customerName

  await db.update(reviews).set({ customerName, commentEn, commentKo, commentVi, adminReply, adminEdited: current.adminEdited || textChanged }).where(eq(reviews.id, id))
  revalidatePath("/admin/reviews")
  revalidatePath("/reviews")
  revalidatePath("/")
  return { ok: true }
}


