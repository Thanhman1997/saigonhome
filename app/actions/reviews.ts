"use server"

import { db } from "@/lib/db"
import { bookings, reviews } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function submitReview(formData: FormData) {
  const reference = String(formData.get("reference") ?? "").trim().toUpperCase()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const customerName = String(formData.get("customerName") ?? "").trim()
  const comment = String(formData.get("comment") ?? "").trim()
  const rating = Number(formData.get("rating"))
  if (!reference || !email || !customerName || !comment || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Please complete all review fields.")
  const booking = await db.select({ id: bookings.id, therapistId: bookings.therapistId, customerName: bookings.customerName, date: bookings.date, status: bookings.status }).from(bookings).where(and(eq(bookings.reference, reference), eq(bookings.email, email))).limit(1)
  if (!booking[0] || booking[0].status !== "completed") throw new Error("Only completed bookings can leave a review.")
  const existing = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.bookingId, booking[0].id)).limit(1)
  if (existing[0]) throw new Error("This booking already has a review.")
  await db.insert(reviews).values({ bookingId: booking[0].id, therapistId: booking[0].therapistId, customerName, rating, comment, reviewDate: booking[0].date, approved: false })
  revalidatePath("/reviews")
  revalidatePath("/admin/reviews")
  return { ok: true }
}
