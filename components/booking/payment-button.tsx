"use client"

import { useState } from "react"
import { createPaymentOrder } from "@/app/actions/payments"

export function PaymentButton({ reference }: { reference: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  async function handlePayment() {
    setLoading(true); setError("")
    try {
      const result = await createPaymentOrder(reference)
      if (result.success) {
      // Stripe Checkout cannot be rendered inside the v0 preview iframe.
      // Open it in a separate tab so the browser does not block the redirect.
      if (window.self !== window.top) window.open(result.redirectUrl, "_blank", "noopener,noreferrer")
      else window.location.assign(result.redirectUrl)
      setLoading(false)
      } else { setError(result.error); setLoading(false) }
    } catch (error) {
      console.error("[v0] Payment checkout failed", error)
      setError("Không thể mở trang thanh toán. Vui lòng thử lại.")
      setLoading(false)
    }
  }
  return <div className="flex flex-col items-center gap-3"><button type="button" onClick={handlePayment} disabled={loading} className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">{loading ? "Opening secure checkout…" : "Pay securely"}</button>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<p className="text-sm text-muted-foreground">Test mode · Visa and Mastercard supported by Stripe</p></div>
}
