import { Resend } from "resend"
import { escapeHtml } from "@/lib/security"
import { getBookingManagementUrl } from "@/lib/booking-management-token"
import { bookingEmailCopy, type Locale } from "@/lib/booking-management-locale"

export function customerBookingEmailSender() {
  return process.env.RESEND_FROM_EMAIL ?? "Lotus Wellness <booking@lotuswellness.app>"
}

export function bookingManagementEmailLink(id: number, locale?: Locale) {
  const text = bookingEmailCopy[locale ?? "en"]
  return `<p><a href="${escapeHtml(getBookingManagementUrl(id, locale))}" style="display:inline-block;padding:12px 20px;border-radius:24px;background:#26362f;color:#fff;text-decoration:none">${text.manage}</a></p><p>${text.private}</p>`
}

export async function sendBookingManagementEmail(booking: { id: number; reference: string; email: string; date: string; time: string }, service: string | null, type: "received" | "rescheduled" | "cancelled" | "link", locale?: Locale) {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const text = bookingEmailCopy[locale ?? "en"]
  const title = text[type]
  try {
    const { error } = await new Resend(key).emails.send({
      from: customerBookingEmailSender(),
      to: booking.email,
      subject: `${title} — ${booking.reference}`,
      html: `<div lang="${locale ?? "en"}" style="font-family:sans-serif;max-width:560px;margin:auto"><h2>${title}</h2><p><strong>${escapeHtml(service || text.service)}</strong> · ${escapeHtml(booking.date)} · ${escapeHtml(booking.time)} (${text.time})</p><p>${text.reference}: ${escapeHtml(booking.reference)}</p>${type === "received" ? `<p>${text.pending}</p>` : ""}${type === "cancelled" ? "" : bookingManagementEmailLink(booking.id, locale)}</div>`,
    })
    if (error) console.error("Booking email was not accepted:", error.name)
    return !error
  } catch {
    console.error("Booking email could not be sent")
    return false
  }
}
