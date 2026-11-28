import { escapeHtml } from "@/lib/security"
import { getBookingManagementUrl } from "@/lib/booking-management-token"
import { bookingEmailCopy, formatBookingDate, formatBookingTime, bookingStatusLabels, type Locale } from "@/lib/booking-management-locale"
import { sendTransactionalEmail } from "@/lib/transactional-email"

const additionalCopy = {
  en: { confirmed: "Booking confirmed", reminder: "Your appointment is coming up", therapist: "Therapist", unassigned: "To be assigned", status: "Status" },
  vi: { confirmed: "Đã xác nhận lịch hẹn", reminder: "Sắp đến giờ hẹn của bạn", therapist: "Kỹ thuật viên", unassigned: "Sẽ được sắp xếp", status: "Trạng thái" },
  ko: { confirmed: "예약이 확정되었습니다", reminder: "예약 시간이 다가옵니다", therapist: "테라피스트", unassigned: "배정 예정", status: "상태" },
}

type EmailBooking = { reference: string; email: string; date: string; time: string; status?: string; customerName?: string; durationMinutes?: number }

const paymentNotice = {
  en: "We only accept payment by cash or bank transfer.",
  vi: "Chúng tôi chỉ chấp nhận thanh toán bằng tiền mặt hoặc chuyển khoản.",
  ko: "결제는 현금 또는 계좌이체만 가능합니다.",
}

export function stripLegacyPaymentInstructions(template: string) {
  return template
    .replace(/^Payment options:[\t ]*\r?\n1\. Pay directly at the spa or by bank transfer\.[\t ]*\r?\n2\. Pay by Visa or Mastercard: {{paymentUrl}}[\t ]*(?:\r?\n|$)/gim, "")
    .replace(/^.*{{paymentUrl}}.*(?:\r?\n|$)/gm, "")
}

export async function sendBookingManagementEmail(booking: EmailBooking, service: string | null, type: "received" | "rescheduled" | "cancelled" | "rejected" | "link" | "confirmed" | "reminder", locale: Locale = "en", options?: { token?: string; therapist?: string | null; template?: string | null }) {
  const text = { ...bookingEmailCopy[locale], ...additionalCopy[locale] }
  const title = text[type]
  const [customSubject, ...customBody] = options?.template?.split("\n") ?? []
  const values = { reference: booking.reference, service: service || text.service, date: formatBookingDate(booking.date, locale), time: formatBookingTime(booking.time, locale), customerName: booking.customerName ?? "", duration: String(booking.durationMinutes ?? "") }
  const templateValue = (value: string) => value.replace(/{{paymentUrl}}/g, "").replace(/{{(reference|service|date|time|customerName|duration)}}/g, (_, key: keyof typeof values) => values[key])
  const body = type === "confirmed" ? stripLegacyPaymentInstructions(customBody.join("\n")).trim() : customBody.join("\n")
  const state = bookingStatusLabels[locale][booking.status as keyof typeof bookingStatusLabels.en]
  const link = options?.token ? `<p><a href="${escapeHtml(getBookingManagementUrl(options.token, locale))}" style="display:inline-block;padding:12px 20px;border-radius:24px;background:#26362f;color:#fff;text-decoration:none">${text.manage}</a></p><p>${text.private}</p>` : ""
  return sendTransactionalEmail({
    to: booking.email,
    subject: customSubject ? templateValue(customSubject) : `${title} — ${booking.reference}`,
    html: `<div lang="${locale}" style="font-family:sans-serif;max-width:560px;margin:auto"><p>LOTUS WELLNESS</p><h2>${title}</h2><p><strong>${escapeHtml(values.service)}</strong> · ${escapeHtml(values.date)} · ${escapeHtml(values.time)} (${text.time})</p><p>${text.reference}: ${escapeHtml(booking.reference)}<br>${text.therapist}: ${escapeHtml(options?.therapist || text.unassigned)}${state ? `<br>${text.status}: ${state}` : ""}</p>${body ? `<p>${escapeHtml(templateValue(body)).replaceAll("\n", "<br>")}</p>` : ""}${type === "confirmed" ? `<p>${paymentNotice[locale]}</p>` : ""}${link}</div>`,
  })
}
