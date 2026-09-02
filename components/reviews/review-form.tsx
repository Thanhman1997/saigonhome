"use client"

import { useState } from "react"
import { submitReview } from "@/app/actions/reviews"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n/language-provider"

const labels = {
  en: { name: "Your name", review: "Your review", rating: "Rating", submit: "Submit review", sending: "Submitting…", success: "Thank you. Your review is pending approval.", placeholder: "Tell us about your experience" },
  vi: { name: "Tên của bạn", review: "Đánh giá", rating: "Xếp hạng", submit: "Gửi đánh giá", sending: "Đang gửi…", success: "Cảm ơn bạn. Đánh giá đang chờ duyệt.", placeholder: "Chia sẻ trải nghiệm của bạn" },
  ko: { name: "이름", review: "후기", rating: "평점", submit: "후기 보내기", sending: "보내는 중…", success: "감사합니다. 후기는 승인 대기 중입니다.", placeholder: "경험을 들려주세요" },
} as const

export function ReviewForm() {
  const { locale } = useLanguage()
  const copy = labels[locale as keyof typeof labels] ?? labels.en
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("")
    try { await submitReview(new FormData(event.currentTarget)); event.currentTarget.reset(); setMessage(copy.success) } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to submit review.") } finally { setPending(false) }
  }
  return <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-2xl border border-lotus-pink/60 bg-card p-5 sm:p-7">
    <input type="hidden" name="sourceLanguage" value={locale === "ko" ? "ko" : locale === "vi" ? "vi" : "en"} />
    <div className="flex flex-col gap-2"><Label htmlFor="review-name">{copy.name}</Label><Input id="review-name" name="customerName" required /></div>
    <div className="flex flex-col gap-2"><Label htmlFor="review-text">{copy.review}</Label><Textarea id="review-text" name="reviewText" rows={5} placeholder={copy.placeholder} required minLength={10} /></div>
    <div className="flex flex-col gap-2"><Label htmlFor="review-rating">{copy.rating}</Label><select id="review-rating" name="rating" defaultValue="5" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="5">5 — Excellent</option><option value="4">4 — Very good</option><option value="3">3 — Good</option><option value="2">2 — Fair</option><option value="1">1 — Poor</option></select></div>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}<Button type="submit" disabled={pending} className="w-full">{pending ? copy.sending : copy.submit}</Button>
  </form>
}
