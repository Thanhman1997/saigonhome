"use client"

import { useState, useTransition } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateReview } from "@/app/actions/admin"

type ReviewEditable = {
  id: number
  customerName: string
  comment: string
  commentEn: string | null
  commentKo: string | null
  commentVi: string | null
  adminReply: string | null
}

export function ReviewEditDialog({ review }: { review: ReviewEditable }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setError("")
    startTransition(async () => {
      try {
        await updateReview(review.id, {
          customerName: String(data.get("customerName") ?? ""),
          commentEn: String(data.get("commentEn") ?? ""),
          commentKo: String(data.get("commentKo") ?? ""),
          commentVi: String(data.get("commentVi") ?? ""),
          adminReply: String(data.get("adminReply") ?? ""),
        })
        setOpen(false)
      } catch {
        setError("Unable to save. Check the fields and try again.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground">
          <Pencil className="size-3.5" />
          Edit / Reply
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit review</DialogTitle>
          <DialogDescription>
            Fix typos or translations, and add a public reply. The customer&apos;s original text is always kept below and is never overwritten.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Original text from customer</p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{review.comment}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`review-name-${review.id}`}>Display name</Label>
            <Input id={`review-name-${review.id}`} name="customerName" defaultValue={review.customerName} required maxLength={120} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`review-en-${review.id}`}>Shown in English</Label>
            <Textarea id={`review-en-${review.id}`} name="commentEn" defaultValue={review.commentEn ?? ""} rows={3} maxLength={2000} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`review-ko-${review.id}`}>Shown in Korean</Label>
            <Textarea id={`review-ko-${review.id}`} name="commentKo" defaultValue={review.commentKo ?? ""} rows={3} maxLength={2000} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`review-vi-${review.id}`}>Shown in Vietnamese</Label>
            <Textarea id={`review-vi-${review.id}`} name="commentVi" defaultValue={review.commentVi ?? ""} rows={3} maxLength={2000} />
            <p className="text-xs text-muted-foreground">A review stays hidden in any language where this text is left empty.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`review-reply-${review.id}`}>Public reply from Lotus Wellness (optional)</Label>
            <Textarea id={`review-reply-${review.id}`} name="adminReply" defaultValue={review.adminReply ?? ""} rows={3} maxLength={2000} placeholder="Thank you for your feedback…" />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
