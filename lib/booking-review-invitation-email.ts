import { bookings } from "@/lib/db/schema"
import { createReviewInvitation } from "@/lib/review-invitation"
import { escapeHtml } from "@/lib/security"
import { sendTransactionalEmail } from "@/lib/transactional-email"
import { getSiteUrl } from "@/lib/site-url"

type ReviewInvitationBooking = Pick<typeof bookings.$inferSelect, "id" | "locale" | "email" | "reference">

export async function sendBookingReviewInvitation(booking: ReviewInvitationBooking) {
  try {
    const reviewUrl = new URL("/reviews", getSiteUrl())
    reviewUrl.searchParams.set("invite", createReviewInvitation(booking.id))
    reviewUrl.hash = "write-review"
    const locale = booking.locale === "vi" || booking.locale === "ko" ? booking.locale : "en"
    const copy = {
      en: { subject: "How was your visit?", title: "Thank you for choosing Lotus Wellness", body: "Your feedback helps us care for every guest better.", action: "Write a review", expires: "This private link expires in 30 days." },
      vi: { subject: "Trải nghiệm của bạn thế nào?", title: "Cảm ơn bạn đã chọn Lotus Wellness", body: "Góp ý của bạn giúp chúng tôi phục vụ khách hàng tốt hơn.", action: "Viết đánh giá", expires: "Liên kết riêng này hết hạn sau 30 ngày." },
      ko: { subject: "이용 경험은 어떠셨나요?", title: "Lotus Wellness를 이용해 주셔서 감사합니다", body: "고객님의 의견은 더 나은 서비스를 제공하는 데 도움이 됩니다.", action: "후기 작성", expires: "이 전용 링크는 30일 후 만료됩니다." },
    }[locale]
    const accepted = await sendTransactionalEmail({
      to: booking.email,
      subject: `${copy.subject} — ${booking.reference}`,
      html: `<div lang="${locale}" style="font-family:sans-serif;max-width:560px;margin:auto;color:#24312d"><h2>${copy.title}</h2><p>${copy.body}</p><p><a href="${escapeHtml(reviewUrl.href)}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#24312d;color:#ffffff;text-decoration:none">${copy.action}</a></p><p>${copy.expires}</p></div>`,
    })
    if (!accepted) console.error("Review invitation was not accepted", { bookingId: booking.id })
    return accepted
  } catch {
    console.error("Review invitation could not be prepared or sent", { bookingId: booking.id })
    return false
  }
}
