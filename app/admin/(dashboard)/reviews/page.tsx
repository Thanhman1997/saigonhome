import Link from "next/link"
import { Star } from "lucide-react"
import { getAllReviewsWithRelations } from "@/lib/admin-data"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ReviewApprovalToggle } from "@/components/admin/review-approval-toggle"
import { DeleteReviewButton } from "@/components/admin/delete-review-button"
import { ReviewEditDialog } from "@/components/admin/review-edit-dialog"

export const metadata = { title: "Reviews" }

const FILTERS = [
  { key: "all", label: "All" },
  { key: "hidden", label: "Hidden / pending" },
  { key: "published", label: "Published" },
  { key: "low", label: "Low rating (1-2)" },
] as const

type FilterKey = (typeof FILTERS)[number]["key"]

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter: rawFilter } = await searchParams
  const filter: FilterKey = FILTERS.some((f) => f.key === rawFilter) ? (rawFilter as FilterKey) : "all"
  const reviews = await getAllReviewsWithRelations()

  const counts: Record<FilterKey, number> = {
    all: reviews.length,
    hidden: reviews.filter((r) => !r.approved).length,
    published: reviews.filter((r) => r.approved).length,
    low: reviews.filter((r) => r.rating <= 2).length,
  }
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  const visible = reviews.filter((r) => (filter === "hidden" ? !r.approved : filter === "published" ? r.approved : filter === "low" ? r.rating <= 2 : true))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          {reviews.length} review{reviews.length === 1 ? "" : "s"}
          {reviews.length > 0 && ` · average ${average.toFixed(1)} / 5`} · new reviews stay hidden until you publish them
        </p>
      </div>

      <nav aria-label="Filter reviews" className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Link
            key={item.key}
            href={item.key === "all" ? "/admin/reviews" : `/admin/reviews?filter=${item.key}`}
            aria-current={filter === item.key ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              filter === item.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label} <span className="opacity-70">({counts[item.key]})</span>
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-3">
        {visible.map((review) => (
          <article key={review.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{review.customerName}</span>
                <Badge variant={review.approved ? "secondary" : "outline"}>{review.approved ? "Published" : "Hidden"}</Badge>
                {review.adminEdited && <Badge variant="outline">Edited</Badge>}
                {review.rating <= 2 && <Badge variant="destructive">Low rating</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5" role="img" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("size-3.5", i < review.rating ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/40")} />
                  ))}
                </span>
                <span>{new Date(review.reviewDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                {review.bookingReference ? <span className="font-mono">{review.bookingReference}</span> : <span>No booking linked</span>}
                <span>{review.therapist ? `Therapist ${review.therapist.code}` : "General"}</span>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{review.comment}</p>
              {review.adminReply && (
                <div className="rounded-md bg-muted/60 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Public reply</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{review.adminReply}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
              <ReviewApprovalToggle reviewId={review.id} approved={review.approved} />
              <ReviewEditDialog review={review} />
              <DeleteReviewButton reviewId={review.id} />
            </div>
          </article>
        ))}
        {visible.length === 0 && <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">No reviews in this view.</div>}
      </div>
    </div>
  )
}
