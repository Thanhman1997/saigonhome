import { getAllReviewsWithRelations } from "@/lib/admin-data"
import { Star } from "lucide-react"
import { ReviewApprovalToggle } from "@/components/admin/review-approval-toggle"
import { DeleteReviewButton } from "@/components/admin/delete-review-button"

export const metadata = { title: "Reviews" }

export default async function AdminReviewsPage() {
  const reviews = await getAllReviewsWithRelations()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          {reviews.length} total review{reviews.length === 1 ? "" : "s"} · toggle to show or hide on the public site
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{review.customerName}</span>
                <span className="text-xs text-muted-foreground">
                  {review.therapist ? `Therapist ${review.therapist.code}` : "General"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.reviewDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/40"}`}
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{review.comment}</p>
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
              <ReviewApprovalToggle reviewId={review.id} approved={review.approved} />
              <DeleteReviewButton reviewId={review.id} />
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-muted-foreground">
            No reviews yet.
          </div>
        )}
      </div>
    </div>
  )
}
