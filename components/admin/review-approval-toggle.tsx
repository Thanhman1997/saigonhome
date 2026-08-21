"use client"

import { useTransition } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toggleReviewApproval } from "@/app/actions/admin"

export function ReviewApprovalToggle({ reviewId, approved }: { reviewId: number; approved: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`review-${reviewId}`}
        checked={approved}
        disabled={isPending}
        onCheckedChange={(checked) => startTransition(() => toggleReviewApproval(reviewId, checked))}
      />
      <Label htmlFor={`review-${reviewId}`} className="text-xs text-muted-foreground">
        {approved ? "Published" : "Hidden"}
      </Label>
    </div>
  )
}
