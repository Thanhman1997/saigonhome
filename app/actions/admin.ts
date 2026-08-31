"use server"

import { db } from "@/lib/db"
import { bookings, reviews, services } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"
import { Resend } from "resend"

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
      await resend.emails.send({
        from: "Lotus Wellness <onboarding@resend.dev>",
        to: booking.booking.email,
        subject: confirmed ? `Booking confirmed — ${booking.booking.reference}` : `Booking update — ${booking.booking.reference}`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#24312d"><h2>${confirmed ? "Booking confirmed" : "Booking cancelled"}</h2><p>Dear ${booking.booking.customerName},</p><p>${confirmed ? "Your Lotus Wellness booking has been confirmed." : "Unfortunately, we cannot confirm this booking. Please contact us to choose another time."}</p><p><strong>Reference:</strong> ${booking.booking.reference}</p><p><strong>Service:</strong> ${booking.service?.nameEn ?? "Massage"} (${booking.booking.durationMinutes} min)</p><p><strong>Date &amp; time:</strong> ${booking.booking.date} at ${booking.booking.time}</p></div>`,
      })
    }
  }
  revalidatePath("/admin/bookings")
}

export async function toggleReviewApproval(id: number, approved: boolean) {
  await assertAdmin()
  await db.update(reviews).set({ approved }).where(eq(reviews.id, id))
  revalidatePath("/admin/reviews")
  revalidatePath("/")
}

export async function deleteReview(id: number) {
  await assertAdmin()
  await db.delete(reviews).where(eq(reviews.id, id))
  revalidatePath("/admin/reviews")
  revalidatePath("/")
}


