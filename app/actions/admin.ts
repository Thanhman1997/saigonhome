"use server"

import { db } from "@/lib/db"
import { bookings, reviews, services, siteContent } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"
import { Resend } from "resend"
import { createReviewInvitation } from "@/lib/review-invitation"
import { escapeHtml } from "@/lib/security"

const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const
type BookingStatus = (typeof BOOKING_STATUSES)[number]

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) {
    throw new Error("Unauthorized")
  }
}

export async function updateBookingStatus(id: number, status: BookingStatus) {
  await assertAdmin()
  if (!BOOKING_STATUSES.includes(status)) throw new Error("Invalid status")
  const [booking] = await db.select({ booking: bookings, service: services }).from(bookings).leftJoin(services, eq(bookings.serviceId, services.id)).where(eq(bookings.id, id)).limit(1)
  if (!booking) throw new Error("Booking not found")
  await db.update(bookings).set({ status }).where(eq(bookings.id, id))
  if ((status === "confirmed" || status === "cancelled") && booking.booking.status !== status) {
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)
      const confirmed = status === "confirmed"
      const [template] = await db.select().from(siteContent).where(eq(siteContent.key, confirmed ? "booking_confirmed_email" : "booking_cancelled_email")).limit(1)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
      const paymentUrl = `${siteUrl}/payment/result?reference=${encodeURIComponent(booking.booking.reference)}`
      const defaultSubject = confirmed ? `Booking confirmed — ${booking.booking.reference}` : `Booking update — ${booking.booking.reference}`
      const defaultBody = confirmed ? `Your booking has been confirmed.\n\nPayment options:\n1. Pay directly at the spa or by bank transfer.\n2. Pay by Visa or Mastercard: ${paymentUrl}` : "Unfortunately, we cannot confirm this booking. Please contact us to choose another time."
      const replaceTokens = (value: string) => value.replaceAll("{{customerName}}", booking.booking.customerName).replaceAll("{{reference}}", booking.booking.reference).replaceAll("{{paymentUrl}}", paymentUrl).replaceAll("{{service}}", booking.service?.nameEn ?? "Massage").replaceAll("{{date}}", booking.booking.date).replaceAll("{{time}}", booking.booking.time).replaceAll("{{duration}}", String(booking.booking.durationMinutes))
      const subject = replaceTokens(template?.valueEn?.split("\n")[0] || defaultSubject)
      const body = replaceTokens(template?.valueEn?.split("\n").slice(1).join("\n") || defaultBody).replaceAll("\n", "<br />")
      await resend.emails.send({
        from: "Lotus Wellness <onboarding@resend.dev>",
        to: booking.booking.email,
        subject,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#24312d"><h2>${confirmed ? "Booking confirmed" : "Booking update"}</h2><p>Dear ${booking.booking.customerName},</p><p>${body}</p><p><strong>Reference:</strong> ${booking.booking.reference}</p><p><strong>Service:</strong> ${booking.service?.nameEn ?? "Massage"} (${booking.booking.durationMinutes} min)</p><p><strong>Date &amp; time:</strong> ${booking.booking.date} at ${booking.booking.time}</p></div>`,
      })
    }
  }
  if (status === "completed" && booking.booking.status !== "completed" && process.env.RESEND_API_KEY) {
    try {
      const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (productionHost ? `https://${productionHost}` : "http://localhost:3000")
      const reviewUrl = new URL("/reviews", siteUrl)
      reviewUrl.searchParams.set("invite", createReviewInvitation(booking.booking.id))
      reviewUrl.hash = "write-review"
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: "Lotus Wellness <onboarding@resend.dev>",
        to: booking.booking.email,
        subject: `How was your visit? — ${booking.booking.reference}`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#24312d"><h2>Thank you for choosing Lotus Wellness</h2><p>Dear ${escapeHtml(booking.booking.customerName)},</p><p>We hope you enjoyed your ${escapeHtml(booking.service?.nameEn ?? "massage")}. Your feedback helps us care for every guest better.</p><p><a href="${escapeHtml(reviewUrl.href)}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#24312d;color:#ffffff;text-decoration:none">Write a review</a></p><p style="color:#6b7571;font-size:13px">This private link expires in 30 days.</p></div>`,
      })
    } catch {
      // A failed invitation email must not block the status change.
    }
  }
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


