"use client"

import { useState } from "react"
import { submitReview } from "@/app/actions/reviews"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function ReviewForm() {
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("")
    try { await submitReview(new FormData(event.currentTarget)); event.currentTarget.reset(); setMessage("Thank you. Your review is pending approval.") } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to submit review.") } finally { setPending(false) }
  }
  return <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-7">
    <div className="grid gap-4 sm:grid-cols-2"><div className="flex flex-col gap-2"><Label htmlFor="review-reference">Booking reference</Label><Input id="review-reference" name="reference" placeholder="e.g. LWS-123456" required /></div><div className="flex flex-col gap-2"><Label htmlFor="review-email">Booking email</Label><Input id="review-email" name="email" type="email" required /></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="flex flex-col gap-2"><Label htmlFor="review-name">Your name</Label><Input id="review-name" name="customerName" required /></div><div className="flex flex-col gap-2"><Label htmlFor="review-rating">Rating</Label><select id="review-rating" name="rating" defaultValue="5" className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="5">5 — Excellent</option><option value="4">4 — Very good</option><option value="3">3 — Good</option><option value="2">2 — Fair</option><option value="1">1 — Poor</option></select></div></div>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-2"><Label htmlFor="review-comment-vi">Review tiếng Việt</Label><Textarea id="review-comment-vi" name="commentVi" rows={4} required minLength={10} /></div>
      <div className="flex flex-col gap-2"><Label htmlFor="review-comment-en">Review in English</Label><Textarea id="review-comment-en" name="commentEn" rows={4} placeholder="Optional" /></div>
      <div className="flex flex-col gap-2"><Label htmlFor="review-comment-ko">한국어 리뷰</Label><Textarea id="review-comment-ko" name="commentKo" rows={4} placeholder="Optional" /></div>
    </div>
    <input type="hidden" name="comment" value="" />
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}<Button type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit review"}</Button>
  </form>
}
