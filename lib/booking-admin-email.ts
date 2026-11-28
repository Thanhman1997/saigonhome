import { escapeHtml } from "@/lib/security"
import { sendTransactionalEmail } from "@/lib/transactional-email"
import { adminBookingReviewUrl } from "@/lib/booking-review-token"

type AdminChangeBooking = {
  id: number
  reference: string
  customerName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  detailedAddress?: string | null
  guests?: number | null
  date: string
  time: string
}

export type AdminChangeRequest = {
  kind: "reschedule_requested" | "cancel_requested"
  requested?: { date: string; time: string }
  service?: string | null
  therapist?: string | null
}

const adminRecipient = () => process.env.ADMIN_EMAIL ?? "saigonservice2020@gmail.com"

export async function sendAdminBookingChangeEmail(booking: AdminChangeBooking, change: AdminChangeRequest) {
  try {
    const rescheduling = change.kind === "reschedule_requested"
    const title = rescheduling ? "Customer asked to change the time" : "Customer asked to cancel"
    const row = (label: string, value: string) =>
      `<tr><td style="padding:6px 0;color:#666;vertical-align:top">${label}</td><td style="padding:6px 0">${value}</td></tr>`
    const address = [booking.address, booking.detailedAddress].filter(Boolean).map((part) => escapeHtml(String(part))).join(" — ")
    const rows = [
      row("Current time", `${escapeHtml(booking.date)} at ${escapeHtml(booking.time)}`),
      change.requested ? row("Requested time", `<strong>${escapeHtml(change.requested.date)} at ${escapeHtml(change.requested.time)}</strong>`) : "",
      change.service ? row("Service", escapeHtml(change.service)) : "",
      change.therapist ? row("Therapist", escapeHtml(change.therapist)) : "",
      booking.guests ? row("Guests", String(booking.guests)) : "",
      booking.customerName ? row("Customer", escapeHtml(booking.customerName)) : "",
      booking.email ? row("Email", escapeHtml(booking.email)) : "",
      booking.phone ? row("Phone", escapeHtml(booking.phone)) : "",
      address ? row("Address", address) : "",
    ].join("")
    const reviewUrl = adminBookingReviewUrl(booking.id)

    return await sendTransactionalEmail({
      to: adminRecipient(),
      replyTo: booking.email,
      subject: `${rescheduling ? "Change request" : "Cancellation request"} — ${booking.reference}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto"><h2 style="margin-bottom:4px">${title}</h2><p style="color:#666;margin-top:0">Reference: <strong>${escapeHtml(booking.reference)}</strong>. The booking stays unchanged until you confirm.</p><table style="width:100%;border-collapse:collapse;margin-top:16px">${rows}</table><p style="margin-top:20px"><a href="${escapeHtml(reviewUrl)}" style="display:inline-block;padding:12px 20px;border-radius:24px;background:#26362f;color:#fff;text-decoration:none">${rescheduling ? "Confirm new time" : "Confirm cancellation"}</a></p><p style="color:#666">The button opens a secure page where you confirm or decline, with no login needed. The customer receives the confirmation email only after you confirm.</p></div>`,
    })
  } catch {
    console.error("Could not send admin booking change request")
    return false
  }
}
