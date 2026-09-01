import { getApprovedReviews } from "@/lib/data"
import { Header } from "@/components/header"
import { ReviewForm } from "@/components/reviews/review-form"
import { Star } from "lucide-react"
import { LocalizedReviewList } from "@/components/reviews/localized-review-list"

export const dynamic = "force-dynamic"
export const metadata = { title: "Reviews | Lotus Wellness" }

export default async function ReviewsPage() {
  const reviews = await getApprovedReviews()
  const average = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : "5.0"
  return <><Header /><main className="min-h-screen bg-background px-5 py-16 text-foreground sm:px-8"><div className="mx-auto flex max-w-5xl flex-col gap-12"><a href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">← Quay lại trang chủ</a><header className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Guest experiences</p><h1 className="mt-4 text-balance font-serif text-5xl font-light tracking-tight sm:text-7xl">Moments of care, shared by our guests.</h1><p className="mt-5 text-base leading-7 text-muted-foreground">Read real experiences from guests who have welcomed Lotus Wellness into their homes.</p></header><section className="flex flex-wrap items-center gap-6 border-y border-border py-5"><div className="flex items-center gap-2 text-accent">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-5 fill-current" />)}</div><span className="text-lg font-semibold">{average} / 5</span><span className="text-sm text-muted-foreground">{reviews.length} guest reviews</span></section><LocalizedReviewList reviews={reviews} /><section className="grid gap-6 border-t border-border pt-12 lg:grid-cols-[0.7fr_1fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Your turn</p><h2 className="mt-3 font-serif text-4xl font-light">Share your experience</h2><p className="mt-4 leading-7 text-muted-foreground">Reviews are available to guests with a completed booking. Every submission is reviewed before appearing publicly.</p></div><ReviewForm /></section></div></main></>
}
