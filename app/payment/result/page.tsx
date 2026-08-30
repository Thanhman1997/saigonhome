import Link from "next/link"
import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getCheckoutPaymentStatus } from "@/lib/payments/stripe-gateway"

export default async function PaymentResult({ searchParams }: { searchParams: Promise<{ session_id?: string; cancelled?: string; order_id?: string }> }) {
  const params = await searchParams
  const gatewayResult = params.session_id ? await getCheckoutPaymentStatus(params.session_id).catch(() => null) : null
  const reference = (gatewayResult?.orderId ?? params.order_id)?.replace(/^ORDER-/, "")
  const [booking] = reference ? await db.select({ reference: bookings.reference, paymentStatus: bookings.paymentStatus }).from(bookings).where(eq(bookings.reference, reference)).limit(1) : []
  const paid = booking?.paymentStatus === "PAID" || gatewayResult?.status === "PAID"
  return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16"><section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Lotus Wellness</p><h1 className="mt-4 font-serif text-4xl text-foreground">{paid ? "Payment confirmed" : params.cancelled ? "Payment cancelled" : "Payment processing"}</h1><p className="mt-4 leading-6 text-muted-foreground">{paid ? "Your booking is confirmed and your payment has been received." : "Your payment status will update automatically after Stripe confirms the transaction. Please keep your booking reference."}</p>{booking?.reference && <p className="mt-5 font-mono text-sm text-foreground">{booking.reference}</p>}<Link href="/" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Return home</Link></section></main>
}
