import Stripe from "stripe"
import type { PaymentGateway, PaymentOrder, PaymentGatewayResult } from "./types"

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe sandbox is not configured")
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function getCheckoutPaymentStatus(sessionId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId)
  return { status: session.payment_status === "paid" ? "PAID" : "PENDING_PAYMENT", orderId: session.metadata?.orderId ?? "" }
}

export const stripeGateway: PaymentGateway = {
  async createPayment(order: PaymentOrder): Promise<PaymentGatewayResult> {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.customerEmail,
      line_items: [{ price_data: { currency: "vnd", product_data: { name: order.description }, unit_amount: order.amountVnd }, quantity: 1 }],
      metadata: { orderId: order.orderId, bookingId: String(order.bookingId) },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/payment/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/payment/result?cancelled=1&order_id=${encodeURIComponent(order.orderId)}`,
      integration_identifier: `saigonhome_${Math.random().toString(36).slice(2, 10)}`,
    })
    if (!session.url) throw new Error("Stripe did not return a checkout URL")
    return { redirectUrl: session.url, providerOrderId: session.id }
  },
  async verifyWebhook(payload, signature) {
    if (!process.env.STRIPE_WEBHOOK_SECRET || !signature) throw new Error("Missing Stripe webhook signature")
    const stripe = getStripe()
    const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET)
    const session = event.data.object as Stripe.Checkout.Session
    const status = event.type === "checkout.session.completed" && session.payment_status === "paid" ? "PAID" : "PAYMENT_FAILED"
    return { orderId: session.metadata?.orderId ?? "", status, transactionId: typeof session.payment_intent === "string" ? session.payment_intent : undefined }
  },
}
