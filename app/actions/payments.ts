"use server"

import { db } from "@/lib/db"
import { bookings, services } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { stripeGateway } from "@/lib/payments/stripe-gateway"

export async function createPaymentOrder(reference: string) {
  const [booking] = await db.select().from(bookings).where(eq(bookings.reference, reference.trim())).limit(1)
  if (!booking) return { success: false as const, error: "Booking not found" }
  if (booking.status !== "confirmed") return { success: false as const, error: "Payment is available after the booking is confirmed" }
  if (booking.paymentStatus === "PAID") return { success: false as const, error: "This booking is already paid" }
  const [service] = await db.select().from(services).where(eq(services.id, booking.serviceId)).limit(1)
  if (!service) return { success: false as const, error: "Service not found" }
  const orderId = booking.paymentOrderId ?? `ORDER-${booking.reference}`
  const result = await stripeGateway.createPayment({ bookingId: booking.id, orderId, amountVnd: booking.totalVnd, customerName: booking.customerName, customerEmail: booking.email, description: `${service.nameEn} — ${booking.durationMinutes} minutes` })
  await db.update(bookings).set({ paymentOrderId: orderId, paymentStatus: "PENDING_PAYMENT" }).where(eq(bookings.id, booking.id))
  return { success: true as const, redirectUrl: result.redirectUrl, orderId }
}
