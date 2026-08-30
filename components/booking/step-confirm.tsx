"use client"

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/lib/booking-context"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { formatVnd, getGroupDiscountRate } from "@/lib/pricing"
import { createBooking } from "@/app/actions/booking"
import { checkIsFirstTimeCustomer } from "@/app/actions/customer"
import type { CustomerInfo } from "./step-details"
import { PaymentButton } from "./payment-button"

export function StepConfirm({
  customerInfo,
  onBack,
  bookingResult,
  setBookingResult,
  onClose,
}: {
  customerInfo: CustomerInfo
  onBack: () => void
  bookingResult: { reference: string; totalVnd: number; subtotalVnd: number; discountVnd: number } | null
  setBookingResult: (r: { reference: string; totalVnd: number; subtotalVnd: number; discountVnd: number } | null) => void
  onClose: () => void
}) {
  const { draft, services, therapists } = useBooking()
  const { t, locale } = useLanguage()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const service = services.find((s) => s.id === draft.serviceId)
  const duration = service?.durations.find((d) => d.minutes === draft.durationMinutes)
  const therapist = draft.therapistId ? therapists.find((th) => th.id === draft.therapistId) : null

  const subtotal = duration ? duration.priceVnd * draft.guests : 0
  const groupRate = getGroupDiscountRate(draft.guests)
  // Estimate for display only — server recomputes and is authoritative.
  const estimatedRate = groupRate
  const estimatedDiscount = Math.round(subtotal * estimatedRate)
  const estimatedTotal = subtotal - estimatedDiscount

  async function handleConfirm() {
    if (!service || !duration || !draft.date || !draft.time) return
    setSubmitting(true)
    setError(null)
    try {
      const isFirstTime = await checkIsFirstTimeCustomer(customerInfo.email)
      const result = await createBooking({
        serviceId: service.id,
        durationMinutes: duration.minutes,
        therapistId: draft.therapistId,
        guests: draft.guests,
        date: draft.date,
        time: draft.time,
        customerName: customerInfo.customerName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address,
        detailedAddress: customerInfo.detailedAddress,
        notes: customerInfo.notes,
        isFirstTime,
      })
      if (result.success) {
        setBookingResult({
          reference: result.reference,
          totalVnd: result.totalVnd,
          subtotalVnd: result.subtotalVnd,
          discountVnd: result.discountVnd,
        })
      } else {
        setError(result.error)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (bookingResult) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <CheckCircle2 className="size-8" />
        </span>
        <h2 className="font-serif text-3xl">{t.booking.success}</h2>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{t.booking.successMessage}</p>
        <div className="mt-2 border border-border px-6 py-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.booking.reference}</p>
          <p className="mt-1 font-mono text-lg">{bookingResult.reference}</p>
        </div>
        <p className="font-serif text-2xl">{formatVnd(bookingResult.totalVnd)}</p>
        <PaymentButton reference={bookingResult.reference} />
        <Button onClick={onClose} size="lg" className="mt-2">
          {t.booking.bookAnother}
        </Button>
      </div>
    )
  }

  if (!service || !duration) return null

  const serviceName = pickLocalized({ en: service.nameEn, ko: service.nameKo, vi: service.nameVi }, locale)

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif text-2xl">{t.booking.summary}</h2>

      <div className="flex flex-col gap-3 border border-border p-5 text-sm">
        <Row label={t.booking.steps.service} value={`${serviceName} · ${duration.minutes} ${t.services.minutes}`} />
        {therapist && <Row label={t.booking.steps.therapist} value={therapist.code} />}
        <Row label={t.booking.selectDate} value={draft.date ?? ""} />
        <Row label={t.booking.selectTime} value={draft.time ?? ""} />
        <Row label={t.booking.guests} value={String(draft.guests)} />
        <Row label={t.booking.name} value={customerInfo.customerName} />
        <Row label={t.booking.address} value={`${customerInfo.address}${customerInfo.detailedAddress ? ", " + customerInfo.detailedAddress : ""}`} />

        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
          <Row label={t.booking.subtotal} value={formatVnd(subtotal)} />
          {estimatedDiscount > 0 && <Row label={t.booking.discount} value={`-${formatVnd(estimatedDiscount)}`} />}
          <div className="flex items-center justify-between font-serif text-xl">
            <span>{t.booking.total}</span>
            <span>{formatVnd(estimatedTotal)}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button variant="outline" onClick={onBack} size="lg" disabled={submitting}>
          {t.booking.back}
        </Button>
        <Button onClick={handleConfirm} size="lg" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {t.booking.confirmBooking}
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
