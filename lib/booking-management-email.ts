import { Resend } from "resend"
import { escapeHtml } from "@/lib/security"
import { getBookingManagementUrl } from "@/lib/booking-management-token"

export function customerBookingEmailSender() {
  return process.env.RESEND_FROM_EMAIL ?? "Lotus Wellness <booking@lotuswellness.app>"
}

export function bookingManagementEmailLink(id: number) {
  return `<p><a href="${escapeHtml(getBookingManagementUrl(id))}" style="display:inline-block;padding:12px 20px;border-radius:24px;background:#26362f;color:#fff;text-decoration:none">Manage booking / Quản lý lịch hẹn</a></p><p>This private link expires after 45 days. Do not share it.</p>`
}

export async function sendBookingManagementEmail(booking: { id: number; reference: string; email: string; date: string; time: string }, service: string, type: "received" | "rescheduled" | "cancelled" | "link") {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const title = { received: "Booking request received", rescheduled: "Booking time updated", cancelled: "Booking cancelled", link: "Your private booking link" }[type]
  try {
    const { error } = await new Resend(key).emails.send({
      from: customerBookingEmailSender(),
      to: booking.email,
      subject: `${title} — ${booking.reference}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:auto"><h2>${title}</h2><p><strong>${escapeHtml(service)}</strong> · ${escapeHtml(booking.date)} at ${escapeHtml(booking.time)} (Vietnam time)</p><p>Reference: ${escapeHtml(booking.reference)}</p>${type === "received" ? "<p>Your request is pending confirmation.</p>" : ""}${type === "cancelled" ? "" : bookingManagementEmailLink(booking.id)}</div>`,
    })
    if (error) console.error("Booking email was not accepted:", error.name)
    return !error
  } catch {
    console.error("Booking email could not be sent")
    return false
  }
}
