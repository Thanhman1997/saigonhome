"use server"

import { db } from "@/lib/db"
import { bookings, reviews } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { translateReview, type ReviewLanguage } from "@/lib/translate-review"

export type SubmitReviewResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "not_found" | "not_eligible" | "duplicate" }

const digitsOnly = (value: string) => value.replace(/\D/g, "")

function contactMatchesBooking(contact: string, booking: { email: string; phone: string }) {
  if (contact.includes("@")) return contact.toLowerCase() === booking.email.trim().toLowerCase()
  const given = digitsOnly(contact)
  const stored = digitsOnly(booking.phone)
  return given.length >= 8 && stored.length >= 8 && given.slice(-8) === stored.slice(-8)
}

function todayInVietnam() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}

export async function submitReview(formData: FormData): Promise<SubmitReviewResult> {
  const reference = String(formData.get("reference") ?? "").trim()
  const contact = String(formData.get("contact") ?? "").trim()
  const sourceLanguage = String(formData.get("sourceLanguage") ?? "vi") as ReviewLanguage
  const reviewText = String(formData.get("reviewText") ?? "").trim()
  const rating = Number(formData.get("rating"))

  if (!reference || !contact || reviewText.length < 10 || reviewText.length > 2000 || !["en", "vi", "ko"].includes(sourceLanguage) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "invalid" }
  }

  const [booking] = await db.select().from(bookings).where(sql`lower(${bookings.reference}) = ${reference.toLowerCase()}`).limit(1)
  // Same message for an unknown reference and a wrong contact so references cannot be probed.
  if (!booking || !contactMatchesBooking(contact, booking)) return { ok: false, error: "not_found" }

  const served = booking.status === "completed" || (booking.status === "confirmed" && booking.date <= todayInVietnam())
  if (!served) return { ok: false, error: "not_eligible" }

  const [existing] = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.bookingId, booking.id)).limit(1)
  if (existing) return { ok: false, error: "duplicate" }

  let translations = { en: reviewText, vi: reviewText, ko: reviewText }
  try { translations = await translateReview(reviewText, sourceLanguage) } catch { /* keep the original review available for admin translation */ }

  try {
    await db.insert(reviews).values({
      bookingId: booking.id,
      therapistId: booking.therapistId,
      customerName: booking.customerName,
      rating,
      comment: reviewText,
      commentEn: translations.en,
      commentKo: translations.ko,
      commentVi: translations.vi,
      reviewDate: todayInVietnam(),
      approved: false,
    })
  } catch {
    // The unique index on booking_id rejects a concurrent second submission.
    return { ok: false, error: "duplicate" }
  }

  revalidatePath("/reviews")
  revalidatePath("/admin/reviews")
  return { ok: true }
}
