"use server"

import { db } from "@/lib/db"
import { bookings, reviews } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { translateReview, type ReviewLanguage } from "@/lib/translate-review"
import { getInvitedBookingId } from "@/lib/review-invitation"

export type SubmitReviewResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "invalid_invitation" | "not_eligible" | "duplicate" | "failed" }

function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } } | null
  return e?.code === "23505" || e?.cause?.code === "23505"
}

function todayInVietnam() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}

export async function submitReview(formData: FormData): Promise<SubmitReviewResult> {
  const token = formData.get("invitation")
  const bookingId = typeof token === "string" ? getInvitedBookingId(token) : null
  if (bookingId === null) return { ok: false, error: "invalid_invitation" }

  const sourceLanguage = String(formData.get("sourceLanguage") ?? "vi") as ReviewLanguage
  const reviewText = String(formData.get("reviewText") ?? "").trim()
  const rating = Number(formData.get("rating"))

  if (reviewText.length < 10 || reviewText.length > 2000 || !["en", "vi", "ko"].includes(sourceLanguage) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "invalid" }
  }

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)
  if (!booking) return { ok: false, error: "invalid_invitation" }
  if (booking.status !== "completed") return { ok: false, error: "not_eligible" }

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
  } catch (error) {
    // Only the unique index on booking_id means a concurrent second submission; anything else is a real failure.
    if (isUniqueViolation(error)) return { ok: false, error: "duplicate" }
    console.error("Review could not be saved", error instanceof Error ? error.message : "unknown")
    return { ok: false, error: "failed" }
  }

  revalidatePath("/reviews")
  revalidatePath("/admin/reviews")
  return { ok: true }
}
