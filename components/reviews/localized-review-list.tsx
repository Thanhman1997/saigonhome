"use client"

import { Star } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-provider"

export function LocalizedReviewList({ reviews }: { reviews: Array<{ id: number; customerName: string; rating: number; comment: string; commentEn?: string | null; commentKo?: string | null; commentVi?: string | null; reviewDate: string }> }) {
  const { locale } = useLanguage()
  const getComment = (review: (typeof reviews)[number]) => {
    const localized = review[locale === "en" ? "commentEn" : locale === "ko" ? "commentKo" : "commentVi"]
    return localized || review.commentVi || review.commentEn || review.commentKo || review.comment || "Review translation is not available yet."
  }
  return <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reviews.map((review) => <article key={review.id} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6"><div className="flex items-center justify-between"><div className="flex gap-1 text-accent">{Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}</div><time className="text-xs text-muted-foreground">{new Date(review.reviewDate).toLocaleDateString(locale === "vi" ? "vi-VN" : locale === "ko" ? "ko-KR" : "en-US", { month: "short", year: "numeric" })}</time></div><p className="leading-7 text-foreground/90">“{getComment(review)}”</p><p className="mt-auto text-sm font-semibold">{review.customerName}</p></article>)}</section>
}
