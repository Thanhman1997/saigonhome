"use server"

import { db } from "@/lib/db"
import { bookings, reviews } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

const BOOKING_STATUSES = ["confirmed", "completed", "cancelled"] as const
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
  await db.update(bookings).set({ status }).where(eq(bookings.id, id))
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


