"use server"

import { db } from "@/lib/db"
import { bookings, reviews, services, siteContent, therapists } from "@/lib/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import { sendBookingManagementEmail } from "@/lib/booking-management-email"
import { availableBookingSlots, lockBookingSchedule, overlappingBookings } from "@/lib/booking-availability"
import { pendingChangeRequest } from "@/lib/booking-change-request"
import { verifyBookingReviewToken } from "@/lib/booking-review-token"
import { revalidatePath } from "next/cache"
import { assertAdmin } from "@/lib/admin-auth"
import { sendTransactionalEmail } from "@/lib/transactional-email"
import { issueBookingToken } from "@/lib/booking-management-token"
import { localizedServiceName } from "@/lib/booking-management-locale"
import { createReviewInvitation } from "@/lib/review-invitation"
import { escapeHtml } from "@/lib/security"
import { getSiteUrl } from "@/lib/site-url"

const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const
type BookingStatus = (typeof BOOKING_STATUSES)[number]

export async function updateBookingStatus(id: number, status: BookingStatus) {
  await assertAdmin()
  return applyBookingStatus(id, status)
}

async function applyBookingStatus(id: number, status: BookingStatus) {
  if (!BOOKING_STATUSES.includes(status)) throw new Error("Invalid status")
  const [booking] = await db.select({ booking: bookings, service: services, therapist: therapists }).from(bookings).leftJoin(services, eq(bookings.serviceId, services.id)).leftJoin(therapists, eq(bookings.therapistId, therapists.id)).where(eq(bookings.id, id)).limit(1)
  if (!booking) throw new Error("Booking not found")
  const current = booking.booking
  const access = status === "confirmed" && current.status !== "confirmed" ? issueBookingToken() : null
  await db.transaction(async (tx) => {
    await lockBookingSchedule(tx)
    if ((status === "confirmed" || status === "pending") && !["pending", "confirmed"].includes(current.status)) {
      if ((await overlappingBookings(tx, current, current.startAt, current.endAt)).length) throw new Error("This time is no longer available")
    }
    const activity = status === current.status ? current.activity : [...current.activity, { kind: status, at: new Date().toISOString(), date: current.date, time: current.time }]
    const [updated] = await tx.update(bookings).set({ status, activity, updatedAt: new Date(), ...(access && { accessTokenHash: access.hash, accessTokenExpiresAt: access.expires, accessTokenRevokedAt: null }) }).where(and(
      eq(bookings.id, id), eq(bookings.status, current.status), eq(bookings.startAt, current.startAt),
    )).returning({ id: bookings.id })
    if (!updated) throw new Error("The booking changed. Refresh and try again.")
  })
  if ((status === "confirmed" || status === "cancelled") && current.status !== status) {
    const [template] = await db.select().from(siteContent).where(eq(siteContent.key, `booking_${status}_email`)).limit(1)
    const locale = current.locale ?? "en"
    await sendBookingManagementEmail({ ...current, status }, localizedServiceName(booking.service, locale), status, locale, {
      therapist: booking.therapist?.code,
      token: access?.token,
      template: template ? { en: template.valueEn, vi: template.valueVi, ko: template.valueKo }[locale] : null,
    })
  }
  const reviewEmailSent = status === "completed" && current.status !== "completed" ? await sendReviewInvitation(current) : null
  revalidatePath("/admin/bookings")
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
  return { updated: Boolean(updated) }
}

export async function resendBookingReviewInvitation(id: number) {
  await assertAdmin()
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) throw new Error("Invalid booking")
  const [booking] = await db.select({ id: bookings.id, locale: bookings.locale, email: bookings.email, reference: bookings.reference }).from(bookings).where(and(eq(bookings.id, id), eq(bookings.status, "completed"))).limit(1)
  return booking ? sendReviewInvitation(booking) : false
}

async function sendReviewInvitation(booking: Pick<typeof bookings.$inferSelect, "id" | "locale" | "email" | "reference">) {
  try {
    const reviewUrl = new URL("/reviews", getSiteUrl())
    reviewUrl.searchParams.set("invite", createReviewInvitation(booking.id))
    reviewUrl.hash = "write-review"
    const locale = booking.locale === "vi" || booking.locale === "ko" ? booking.locale : "en"
    const copy = {
      en: { subject: "How was your visit?", title: "Thank you for choosing Lotus Wellness", body: "Your feedback helps us care for every guest better.", action: "Write a review", expires: "This private link expires in 30 days." },
      vi: { subject: "Trải nghiệm của bạn thế nào?", title: "Cảm ơn bạn đã chọn Lotus Wellness", body: "Góp ý của bạn giúp chúng tôi phục vụ khách hàng tốt hơn.", action: "Viết đánh giá", expires: "Liên kết riêng này hết hạn sau 30 ngày." },
      ko: { subject: "이용 경험은 어떠셨나요?", title: "Lotus Wellness를 이용해 주셔서 감사합니다", body: "고객님의 의견은 더 나은 서비스를 제공하는 데 도움이 됩니다.", action: "후기 작성", expires: "이 전용 링크는 30일 후 만료됩니다." },
    }[locale]
    const accepted = await sendTransactionalEmail({
      to: booking.email,
      subject: `${copy.subject} — ${booking.reference}`,
      html: `<div lang="${locale}" style="font-family:sans-serif;max-width:560px;margin:auto;color:#24312d"><h2>${copy.title}</h2><p>${copy.body}</p><p><a href="${escapeHtml(reviewUrl.href)}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#24312d;color:#ffffff;text-decoration:none">${copy.action}</a></p><p>${copy.expires}</p></div>`,
    })
    if (!accepted) console.error("Review invitation was not accepted", { bookingId: booking.id })
    return accepted
  } catch {
    console.error("Review invitation could not be prepared or sent", { bookingId: booking.id })
    return false
  }
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
      const [updated] = await tx.update(bookings).set({ status: "cancelled", activity, updatedAt: now }).where(eq(bookings.id, id)).returning()
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

function assertReviewToken(id: number, token: string) {
  if (!verifyBookingReviewToken(id, token)) throw new Error("Unauthorized")
}

export async function confirmBookingFromEmail(id: number, token: string) {
  assertReviewToken(id, token)
  const [current] = await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, id)).limit(1)
  if (current?.status !== "pending") throw new Error("This booking is no longer waiting for confirmation")
  await applyBookingStatus(id, "confirmed")
}

export async function approveBookingChangeFromEmail(id: number, token: string) {
  assertReviewToken(id, token)
  return applyBookingChange(id)
}

export async function declineBookingChangeFromEmail(id: number, token: string) {
  assertReviewToken(id, token)
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


