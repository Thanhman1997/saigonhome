import { Resend } from "resend"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { bookingNotifications, bookings } from "@/lib/db/schema"
import { escapeHtml } from "@/lib/security"

export type BookingNotificationEvent = "received" | "confirmed" | "cancelled" | "completed"

type BookingDetails = {
  id: number
  reference: string
  customerName: string
  email: string
  serviceName: string
  durationMinutes: number
  date: string
  time: string
  guests: number
  phone: string
  address: string
  detailedAddress: string | null
  notes: string | null
  totalVnd: number
}

function config() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || process.env.ADMIN_EMAIL,
    admin: process.env.ADMIN_EMAIL,
    brand: process.env.BRAND_NAME || "Lotus Wellness",
  }
}

function money(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`
}

function subject(event: BookingNotificationEvent, detail: BookingDetails) {
  const labels = { received: "Booking request received", confirmed: "Booking confirmed", cancelled: "Booking cancelled", completed: "Thank you for your visit" }
  return `${labels[event]} — ${detail.reference}`
}

function renderHtml(event: BookingNotificationEvent, detail: BookingDetails, recipient: "customer" | "admin") {
  const c = config()
  const intro = recipient === "admin"
    ? event === "received" ? "A new booking request needs your review." : `Booking ${detail.reference} is now ${event}.`
    : ({ received: "Thank you for your booking request. Our team will review it and send a confirmation within 30 minutes.", confirmed: "Your booking has been confirmed. We look forward to welcoming you.", cancelled: "Your booking has been cancelled. Please contact us if you need assistance.", completed: "Thank you for choosing us. We hope you enjoyed your experience." }[event])
  return `<div style="background:#f7f2e4;padding:28px 12px;font-family:Arial,sans-serif;color:#2b2016"><div style="max-width:580px;margin:auto;background:#fff;padding:28px;border-radius:12px"><p style="letter-spacing:.12em;text-transform:uppercase;color:#8a6a3f;font-size:12px">${escapeHtml(c.brand)}</p><h1 style="font-size:24px;margin:8px 0 14px">${escapeHtml(subject(event, detail))}</h1><p style="line-height:1.6">${escapeHtml(intro)}</p><table style="width:100%;border-collapse:collapse;margin-top:20px">${row("Reference", detail.reference)}${row("Service", `${detail.serviceName} · ${detail.durationMinutes} min`)}${row("Date & time", `${detail.date} at ${detail.time}`)}${row("Guests", String(detail.guests))}${recipient === "admin" ? row("Customer", `${detail.customerName} · ${detail.email} · ${detail.phone}`) : ""}${row("Address", `${detail.address}${detail.detailedAddress ? ` — ${detail.detailedAddress}` : ""}`)}${row("Total", money(detail.totalVnd))}</table><p style="color:#6d6258;font-size:13px;margin-top:24px">${recipient === "admin" ? "Please review this request in the admin dashboard." : "If you have questions, reply to this email or contact our team."}</p></div></div>`
}

function row(label: string, value: string) {
  return `<tr><td style="padding:9px 0;color:#74695d;border-bottom:1px solid #eee;width:34%">${escapeHtml(label)}</td><td style="padding:9px 0;border-bottom:1px solid #eee">${escapeHtml(value)}</td></tr>`
}

async function getDetails(bookingId: number): Promise<BookingDetails | null> {
  const [rowData] = await db.select({ booking: bookings, serviceName: bookings.serviceId }).from(bookings).where(eq(bookings.id, bookingId)).limit(1)
  if (!rowData) return null
  return { ...rowData.booking, serviceName: String(rowData.serviceName) } as BookingDetails
}

export async function sendBookingNotification(bookingId: number, event: BookingNotificationEvent, recipient: "customer" | "admin") {
  const detail = await getDetails(bookingId)
  if (!detail) return { sent: false, reason: "booking_not_found" as const }
  const recipientEmail = recipient === "admin" ? config().admin : detail.email
  const idempotencyKey = `${bookingId}:${event}:${recipient}:${recipientEmail}`
  const [existing] = await db.select().from(bookingNotifications).where(eq(bookingNotifications.idempotencyKey, idempotencyKey)).limit(1)
  if (existing?.status === "sent") return { sent: true, duplicate: true }
  const notification = existing ?? (await db.insert(bookingNotifications).values({ bookingId, event, recipient: recipientEmail ?? "", idempotencyKey }).returning())[0]
  const c = config()
  if (!c.apiKey || !c.from || !recipientEmail) {
    await db.update(bookingNotifications).set({ status: "failed", lastError: "Email configuration is incomplete", attemptCount: (notification.attemptCount ?? 0) + 1, updatedAt: new Date() }).where(eq(bookingNotifications.id, notification.id))
    return { sent: false, reason: "email_not_configured" as const }
  }
  try {
    const result = await new Resend(c.apiKey).emails.send({ from: c.from, to: recipientEmail, subject: subject(event, detail), html: renderHtml(event, detail, recipient) })
    await db.update(bookingNotifications).set({ status: "sent", providerMessageId: result.data?.id ?? null, sentAt: new Date(), updatedAt: new Date(), attemptCount: (notification.attemptCount ?? 0) + 1, lastError: null }).where(eq(bookingNotifications.id, notification.id))
    return { sent: true }
  } catch (error) {
    await db.update(bookingNotifications).set({ status: "failed", lastError: error instanceof Error ? error.message : "Email delivery failed", updatedAt: new Date(), attemptCount: (notification.attemptCount ?? 0) + 1 }).where(eq(bookingNotifications.id, notification.id))
    console.error("[v0] booking notification failed", { bookingId, event, recipient })
    return { sent: false, reason: "delivery_failed" as const }
  }
}

export async function sendBookingNotifications(bookingId: number, event: BookingNotificationEvent) {
  await Promise.allSettled([sendBookingNotification(bookingId, event, "customer"), sendBookingNotification(bookingId, event, "admin")])
}
