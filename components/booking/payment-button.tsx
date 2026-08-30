"use client"

import { useState } from "react"
import { createPaymentOrder } from "@/app/actions/payments"

export function PaymentButton({ reference }: { reference: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  async function handlePayment() {
    setLoading(true); setError("")
    const result = await createPaymentOrder(reference)
    if (result.success) window.location.href = result.redirectUrl
    else { setError(result.error); setLoading(false) }
  }
  return <div className="flex flex-col items-center gap-3"><button type="button" onClick={handlePayment} disabled={loading} className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">{loading ? "Opening secure checkout…" : "Pay securely"}</button>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<p className="text-xs text-muted-foreground">Test mode · Visa and Mastercard supported by Stripe</p></div>
}
