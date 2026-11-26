"use client"

import { Star } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-provider"

type PublicReview = {
  id: number
  customerName: string
  rating: number
  comment: string
  commentEn?: string | null
  commentKo?: string | null
  commentVi?: string | null
  adminReply?: string | null
  reviewDate: string
}

const replyLabel = { en: "Reply from Lotus Wellness", vi: "Phản hồi từ Lotus Wellness", ko: "Lotus Wellness의 답변" } as const

export function LocalizedReviewList({ reviews }: { reviews: PublicReview[] }) {
  const { locale } = useLanguage()
  const getComment = (review: PublicReview) => (locale === "en" ? review.commentEn : locale === "ko" ? review.commentKo : review.commentVi)
  const localizedReviews = reviews.filter((review) => Boolean(getComment(review)))
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {localizedReviews.map((review) => (
        <article key={review.id} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 text-accent">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <time className="text-xs text-muted-foreground">
              {new Date(review.reviewDate).toLocaleDateString(locale === "vi" ? "vi-VN" : locale === "ko" ? "ko-KR" : "en-US", { month: "short", year: "numeric" })}
            </time>
          </div>
          <p className="leading-7 text-foreground/90">“{getComment(review)}”</p>
          {review.adminReply && (
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">{replyLabel[locale as keyof typeof replyLabel] ?? replyLabel.en}</p>
              <p className="mt-2 text-sm leading-6 text-foreground/80">{review.adminReply}</p>
            </div>
          )}
          <p className="mt-auto text-sm font-semibold">{review.customerName}</p>
        </article>
      ))}
    </section>
  )
}
