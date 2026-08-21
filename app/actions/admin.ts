"use server"

import { db } from "@/lib/db"
import { bookings, reviews } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendBookingNotification } from "@/lib/booking-notifications"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth"

const BOOKING_STATUSES = ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"] as const
 type BookingStatus = (typeof BOOKING_STATUSES)[number]

const ALLOWED_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "no_show", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
}

async function assertAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!(await isValidAdminSession(token))) {
    throw new Error("Unauthorized")
  }
}

export async function updateBookingStatus(id: number, status: BookingStatus) {
  await assertAdmin()
  if (!BOOKING_STATUSES.includes(status)) throw new Error("Invalid status")
  const [booking] = await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, id)).limit(1)
  if (!booking) throw new Error("Booking not found")
  const currentStatus = booking.status as BookingStatus
  if (!BOOKING_STATUSES.includes(currentStatus) || !ALLOWED_TRANSITIONS[currentStatus].includes(status)) {
    throw new Error(`Cannot change booking from ${currentStatus} to ${status}`)
  }
  await db.update(bookings).set({ status, updatedAt: new Date() }).where(eq(bookings.id, id))
  if (status === "confirmed" || status === "cancelled" || status === "completed") {
    void sendBookingNotification(id, status, "customer")
  }
  revalidatePath("/admin/bookings")
  revalidatePath("/admin")
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


