"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { submitReview } from "@/app/actions/reviews"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/language-provider"

const labels = {
  en: {
    invitationHint: "To leave a review, open the private link in your invitation email. If your link no longer works, contact Lotus Wellness for a new one.",
    review: "Your review",
    rating: "Rating",
    ratingNames: ["Poor", "Fair", "Good", "Very good", "Excellent"],
    submit: "Submit review",
    sending: "Submitting…",
    success: "Thank you. Your review is pending approval.",
    placeholder: "Tell us about your experience",
    errors: {
      invalid: "Please complete every field. Your review needs at least 10 characters.",
      invalid_invitation: "This review link is invalid or expired. Please contact Lotus Wellness for a new one.",
      not_eligible: "Reviews open once your appointment has taken place.",
      duplicate: "A review has already been submitted for this booking.",
      failed: "Unable to submit your review. Please try again.",
    },
  },
  vi: {
    invitationHint: "Để gửi đánh giá, hãy mở liên kết riêng trong email mời đánh giá. Nếu liên kết không còn dùng được, vui lòng liên hệ Lotus Wellness để nhận liên kết mới.",
    review: "Đánh giá",
    rating: "Xếp hạng",
    ratingNames: ["Kém", "Tạm được", "Tốt", "Rất tốt", "Xuất sắc"],
    submit: "Gửi đánh giá",
    sending: "Đang gửi…",
    success: "Cảm ơn bạn. Đánh giá đang chờ duyệt.",
    placeholder: "Chia sẻ trải nghiệm của bạn",
    errors: {
      invalid: "Vui lòng điền đầy đủ. Đánh giá cần ít nhất 10 ký tự.",
      invalid_invitation: "Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ Lotus Wellness để nhận liên kết mới.",
      not_eligible: "Bạn có thể đánh giá sau khi buổi hẹn diễn ra.",
      duplicate: "Đơn đặt lịch này đã có đánh giá.",
      failed: "Không thể gửi đánh giá. Vui lòng thử lại.",
    },
  },
  ko: {
    invitationHint: "후기를 남기려면 초대 이메일에 있는 전용 링크를 열어 주세요. 링크가 작동하지 않으면 Lotus Wellness에 새 링크를 요청해 주세요.",
    review: "후기",
    rating: "평점",
    ratingNames: ["별로예요", "보통이에요", "좋아요", "아주 좋아요", "최고예요"],
    submit: "후기 보내기",
    sending: "보내는 중…",
    success: "감사합니다. 후기는 승인 대기 중입니다.",
    placeholder: "경험을 들려주세요",
    errors: {
      invalid: "모든 항목을 입력해 주세요. 후기는 10자 이상이어야 합니다.",
      invalid_invitation: "후기 링크가 올바르지 않거나 만료되었습니다. Lotus Wellness에 새 링크를 요청해 주세요.",
      not_eligible: "예약 시간이 지난 후에 후기를 작성할 수 있습니다.",
      duplicate: "이 예약에는 이미 후기가 등록되었습니다.",
      failed: "후기를 보낼 수 없습니다. 다시 시도해 주세요.",
    },
  },
} as const

export function ReviewForm({ invitation }: { invitation?: string }) {
  const { locale } = useLanguage()
  const copy = labels[locale as keyof typeof labels] ?? labels.en
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null)
  const [pending, setPending] = useState(false)
  const [rating, setRating] = useState(5)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setPending(true)
    setMessage(null)
    try {
      const result = await submitReview(new FormData(form))
      if (result.ok) {
        form.reset()
        setRating(5)
        setMessage({ text: copy.success, tone: "success" })
      } else {
        setMessage({ text: copy.errors[result.error], tone: "error" })
      }
    } catch {
      setMessage({ text: copy.errors.failed, tone: "error" })
    } finally {
      setPending(false)
    }
  }

  if (!invitation) {
    return <p id="write-review" className="scroll-mt-24 rounded-2xl border border-lotus-pink/60 bg-card p-5 leading-relaxed text-foreground sm:p-7">{copy.invitationHint}</p>
  }

  return (
    <form id="write-review" onSubmit={onSubmit} className="flex scroll-mt-24 flex-col gap-5 rounded-2xl border border-lotus-pink/60 bg-card p-5 sm:p-7">
      <input type="hidden" name="sourceLanguage" value={locale === "ko" ? "ko" : locale === "vi" ? "vi" : "en"} />
      <input type="hidden" name="rating" value={rating} />
      <input type="hidden" name="invitation" value={invitation} />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium leading-none">{copy.rating}</legend>
        <div role="radiogroup" aria-label={copy.rating} className="flex items-center gap-1">
          {copy.ratingNames.map((name, index) => {
            const value = index + 1
            return (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} — ${name}`}
                onClick={() => setRating(value)}
                className="rounded-md p-1 text-accent outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star className={cn("size-7 transition-colors", value <= rating ? "fill-current" : "fill-none opacity-40")} />
              </button>
            )
          })}
          <span className="ml-2 text-sm text-muted-foreground">{copy.ratingNames[rating - 1]}</span>
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="review-text">{copy.review}</Label>
        <Textarea id="review-text" name="reviewText" rows={5} placeholder={copy.placeholder} required minLength={10} maxLength={2000} />
      </div>
      {message && (
        <p role="status" className={cn("text-sm", message.tone === "error" ? "text-destructive" : "text-muted-foreground")}>
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? copy.sending : copy.submit}
      </Button>
    </form>
  )
}
