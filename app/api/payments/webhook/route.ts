import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { stripeGateway } from "@/lib/payments/stripe-gateway"

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = (await headers()).get("stripe-signature")
  try {
    const result = await stripeGateway.verifyWebhook(payload, signature)
    if (!result.orderId) return NextResponse.json({ error: "Missing order id" }, { status: 400 })
    await db.update(bookings).set({ paymentStatus: result.status, paymentTransactionId: result.transactionId ?? null }).where(eq(bookings.paymentOrderId, result.orderId))
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] payment webhook verification failed", error)
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 })
  }
}
