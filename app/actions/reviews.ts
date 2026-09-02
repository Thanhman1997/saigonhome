"use server"

import { db } from "@/lib/db"
import { reviews } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { translateReview, type ReviewLanguage } from "@/lib/translate-review"

export async function submitReview(formData: FormData) {
  const customerName = String(formData.get("customerName") ?? "").trim()
  const sourceLanguage = String(formData.get("sourceLanguage") ?? "vi") as ReviewLanguage
  const reviewText = String(formData.get("reviewText") ?? "").trim()
  const rating = Number(formData.get("rating"))
  if (!customerName || !reviewText || reviewText.length < 10 || !["en", "vi", "ko"].includes(sourceLanguage) || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Please complete your name, review, and rating.")

  let translations = { en: reviewText, vi: reviewText, ko: reviewText }
  try { translations = await translateReview(reviewText, sourceLanguage) } catch { /* keep the original review available for admin translation */ }
  await db.insert(reviews).values({ bookingId: null, therapistId: null, customerName, rating, comment: reviewText, commentEn: translations.en, commentKo: translations.ko, commentVi: translations.vi, reviewDate: new Date().toISOString().slice(0, 10), approved: false })
  revalidatePath("/reviews")
  revalidatePath("/admin/reviews")
  return { ok: true }
}
