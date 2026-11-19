import { escapeHtml } from "@/lib/security"
import { sendTransactionalEmail } from "@/lib/transactional-email"

type AdminChangeBooking = {
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

export type AdminBookingChange = {
  kind: "rescheduled" | "cancelled"
  previous: { date: string; time: string }
  service?: string | null
  therapist?: string | null
}

const adminRecipient = () => process.env.ADMIN_EMAIL ?? "saigonservice2020@gmail.com"

export async function sendAdminBookingChangeEmail(booking: AdminChangeBooking, change: AdminBookingChange) {
  try {
    const rescheduled = change.kind === "rescheduled"
    const title = rescheduled ? "Customer rescheduled a booking" : "Customer cancelled a booking"
    const row = (label: string, value: string) =>
      `<tr><td style="padding:6px 0;color:#666;vertical-align:top">${label}</td><td style="padding:6px 0">${value}</td></tr>`
    const address = [booking.address, booking.detailedAddress].filter(Boolean).map((part) => escapeHtml(String(part))).join(" — ")
    const rows = [
      row("Previous time", `${escapeHtml(change.previous.date)} at ${escapeHtml(change.previous.time)}`),
      rescheduled ? row("New time", `<strong>${escapeHtml(booking.date)} at ${escapeHtml(booking.time)}</strong>`) : "",
      change.service ? row("Service", escapeHtml(change.service)) : "",
      change.therapist ? row("Therapist", escapeHtml(change.therapist)) : "",
      booking.guests ? row("Guests", String(booking.guests)) : "",
      booking.customerName ? row("Customer", escapeHtml(booking.customerName)) : "",
      booking.email ? row("Email", escapeHtml(booking.email)) : "",
      booking.phone ? row("Phone", escapeHtml(booking.phone)) : "",
      address ? row("Address", address) : "",
    ].join("")

    return await sendTransactionalEmail({
      to: adminRecipient(),
      subject: `${rescheduled ? "Booking rescheduled" : "Booking cancelled"} — ${booking.reference}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto"><h2 style="margin-bottom:4px">${title}</h2><p style="color:#666;margin-top:0">Reference: <strong>${escapeHtml(booking.reference)}</strong></p><table style="width:100%;border-collapse:collapse;margin-top:16px">${rows}</table><p style="color:#666;margin-top:16px">Open Admin &gt; Bookings to review this change.</p></div>`,
    })
  } catch {
    console.error("Could not send admin booking change notification")
    return false
  }
}
