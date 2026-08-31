"use client"

import Link from "next/link"
import { Star } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-provider"

export function ReviewsSection({ reviews }: { reviews: Array<{ id: number; customerName: string; rating: number; comment: string; commentEn?: string | null; commentKo?: string | null; commentVi?: string | null }> }) {
  const { locale, t } = useLanguage()
  const localizedReviews = reviews.filter((review) => Boolean(locale === "en" ? review.commentEn : locale === "ko" ? review.commentKo : review.commentVi))
  const localizedComment = (review: (typeof reviews)[number]) => locale === "en" ? review.commentEn : locale === "ko" ? review.commentKo : review.commentVi
  if (!localizedReviews.length) return null
  return <section id="reviews" className="bg-secondary px-5 py-20 sm:px-8"><div className="mx-auto flex max-w-6xl flex-col gap-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{t.reviews.kicker}</p><h2 className="mt-3 font-serif text-4xl font-light sm:text-5xl">{t.reviews.title}</h2></div><Link href="/reviews" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">{t.reviews.link}</Link></div><div className="grid gap-4 md:grid-cols-3">{localizedReviews.slice(0, 3).map((review) => <article key={review.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"><div className="flex gap-1 text-accent">{Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}</div><p className="leading-7 text-foreground/90">“{localizedComment(review)}”</p><p className="mt-auto text-sm font-semibold">{review.customerName}</p></article>)}</div></div></section>
}
