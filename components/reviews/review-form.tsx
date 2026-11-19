"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { submitReview } from "@/app/actions/reviews"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/language-provider"

const labels = {
  en: {
    reference: "Booking reference",
    referenceHint: "Found in your confirmation email.",
    contact: "Email or phone used for the booking",
    review: "Your review",
    rating: "Rating",
    ratingNames: ["Poor", "Fair", "Good", "Very good", "Excellent"],
    submit: "Submit review",
    sending: "Submitting…",
    success: "Thank you. Your review is pending approval.",
    placeholder: "Tell us about your experience",
    errors: {
      invalid: "Please complete every field. Your review needs at least 10 characters.",
      not_found: "We could not match this reference with that email or phone number.",
      not_eligible: "Reviews open once your appointment has taken place.",
      duplicate: "A review has already been submitted for this booking.",
      failed: "Unable to submit your review. Please try again.",
    },
  },
  vi: {
    reference: "Mã đặt lịch",
    referenceHint: "Có trong email xác nhận của bạn.",
    contact: "Email hoặc số điện thoại đã dùng để đặt lịch",
    review: "Đánh giá",
    rating: "Xếp hạng",
    ratingNames: ["Kém", "Tạm được", "Tốt", "Rất tốt", "Xuất sắc"],
    submit: "Gửi đánh giá",
    sending: "Đang gửi…",
    success: "Cảm ơn bạn. Đánh giá đang chờ duyệt.",
    placeholder: "Chia sẻ trải nghiệm của bạn",
    errors: {
      invalid: "Vui lòng điền đầy đủ. Đánh giá cần ít nhất 10 ký tự.",
      not_found: "Không tìm thấy đơn khớp với mã và email/số điện thoại này.",
      not_eligible: "Bạn có thể đánh giá sau khi buổi hẹn diễn ra.",
      duplicate: "Đơn đặt lịch này đã có đánh giá.",
      failed: "Không thể gửi đánh giá. Vui lòng thử lại.",
    },
  },
  ko: {
    reference: "예약 번호",
    referenceHint: "확인 이메일에서 확인하실 수 있습니다.",
    contact: "예약 시 사용한 이메일 또는 전화번호",
    review: "후기",
    rating: "평점",
    ratingNames: ["별로예요", "보통이에요", "좋아요", "아주 좋아요", "최고예요"],
    submit: "후기 보내기",
    sending: "보내는 중…",
    success: "감사합니다. 후기는 승인 대기 중입니다.",
    placeholder: "경험을 들려주세요",
    errors: {
      invalid: "모든 항목을 입력해 주세요. 후기는 10자 이상이어야 합니다.",
      not_found: "예약 번호와 이메일/전화번호가 일치하는 예약을 찾을 수 없습니다.",
      not_eligible: "예약 시간이 지난 후에 후기를 작성할 수 있습니다.",
      duplicate: "이 예약에는 이미 후기가 등록되었습니다.",
      failed: "후기를 보낼 수 없습니다. 다시 시도해 주세요.",
    },
  },
} as const

export function ReviewForm({ initialReference = "" }: { initialReference?: string }) {
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

  return (
    <form id="write-review" onSubmit={onSubmit} className="flex scroll-mt-24 flex-col gap-5 rounded-2xl border border-lotus-pink/60 bg-card p-5 sm:p-7">
      <input type="hidden" name="sourceLanguage" value={locale === "ko" ? "ko" : locale === "vi" ? "vi" : "en"} />
      <input type="hidden" name="rating" value={rating} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="review-reference">{copy.reference}</Label>
          <Input id="review-reference" name="reference" defaultValue={initialReference} autoComplete="off" required />
          <p className="text-xs text-muted-foreground">{copy.referenceHint}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="review-contact">{copy.contact}</Label>
          <Input id="review-contact" name="contact" autoComplete="email" required />
        </div>
      </div>
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
