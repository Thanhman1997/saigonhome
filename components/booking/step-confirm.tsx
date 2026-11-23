"use client"

import { useRef, useState } from "react"
import { formatBookingDate, formatBookingTime, localizeBookingError } from "@/lib/booking-management-locale"
import { dictionary } from "@/lib/i18n/dictionary"
import { track } from "@vercel/analytics"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/lib/booking-context"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { formatVnd, getGroupDiscountRate } from "@/lib/pricing"
import { createBooking, type BookingReceipt } from "@/app/actions/booking"
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/payments/methods"
import Link from "next/link"
import type { CustomerInfo } from "./step-details"

export function StepConfirm({
  customerInfo,
  onBack,
  bookingResult,
  setBookingResult,
}: {
  customerInfo: CustomerInfo
  onBack: () => void
  bookingResult: BookingReceipt | null
  setBookingResult: (r: BookingReceipt | null) => void
}) {
  const { draft, services, therapists, closeBooking } = useBooking()
  const { t, locale } = useLanguage()
  const [submitting, setSubmitting] = useState(false)
  const inFlight = useRef(false)
  const submissionKey = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")

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
    if (inFlight.current || !service || !duration || !draft.date || !draft.time) return
    inFlight.current = true
    setSubmitting(true)
    setError(null)
    try {
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
        paymentMethod,
        locale,
        submissionKey: submissionKey.current ??= crypto.randomUUID(),
      })
      if (result.success) {
        track("booking_submitted", { service: service.slug, guests: String(draft.guests) })
        setBookingResult({
          reference: result.reference,
          totalVnd: result.totalVnd,
          subtotalVnd: result.subtotalVnd,
          discountVnd: result.discountVnd,
          managementEmailSent: result.managementEmailSent,
          locale: result.locale,
        })
      } else {
        setError(result.error)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  if (bookingResult) {
    const locale = bookingResult.locale
    const t = dictionary[locale]
    return (
      <div lang={locale} className="flex flex-col items-center gap-5 py-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <CheckCircle2 className="size-8" />
        </span>
        <h2 className="font-serif text-3xl">{t.booking.success}</h2>
        <div className="mt-2 border border-border px-6 py-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.booking.reference}</p>
          <p className="mt-1 font-mono text-lg">{bookingResult.reference}</p>
        </div>
        <p className="font-sans text-2xl font-semibold tracking-tight">{formatVnd(bookingResult.totalVnd)}</p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{bookingResult.managementEmailSent
          ? { en: "Check your inbox or spam folder for the private link to manage this appointment.", vi: "Kiểm tra hộp thư hoặc thư rác để mở liên kết riêng quản lý lịch này.", ko: "예약 관리를 위한 전용 링크는 받은 편지함 또는 스팸 편지함에서 확인하세요." }[locale]
          : { en: "Your request was saved, but we couldn’t send the management email. Contact Lotus Wellness with the reference above.", vi: "Đã lưu yêu cầu nhưng chưa gửi được email quản lý. Vui lòng liên hệ Lotus Wellness và cung cấp mã lịch hẹn trên.", ko: "예약 요청은 저장되었지만 관리 이메일을 보내지 못했습니다. 위 예약 번호로 문의해 주세요." }[locale]}</p>
        <Link href="/booking#manage" onClick={closeBooking} className="text-sm font-semibold text-foreground underline underline-offset-4">{{ en: "Booking management help", vi: "Hướng dẫn quản lý lịch hẹn", ko: "예약 관리 안내" }[locale]}</Link>
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
        <Row label={t.booking.selectDate} value={draft.date ? formatBookingDate(draft.date, locale) : ""} />
        <Row label={t.booking.selectTime} value={draft.time ? formatBookingTime(draft.time, locale) : ""} />
        <Row label={t.booking.guests} value={String(draft.guests)} />
        <Row label={t.booking.name} value={customerInfo.customerName} />
        <Row label={t.booking.address} value={`${customerInfo.address}${customerInfo.detailedAddress ? ", " + customerInfo.detailedAddress : ""}`} />

        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
          <Row label={t.booking.subtotal} value={formatVnd(subtotal)} />
          {estimatedDiscount > 0 && <Row label={t.booking.discount} value={`-${formatVnd(estimatedDiscount)}`} />}
          <div className="flex items-center justify-between font-sans text-xl font-semibold tracking-tight">
            <span>{t.booking.total}</span>
            <span>{formatVnd(estimatedTotal)}</span>
          </div>
        </div>
      </div>

      <fieldset className="flex flex-col gap-3" disabled={submitting}>
        <legend className="mb-1 text-sm font-medium">{{ en: "Payment method", vi: "Phương thức thanh toán", ko: "결제 방법" }[locale]}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method}
              className="flex cursor-pointer items-center gap-3 border border-border p-4 text-sm has-[:checked]:border-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                className="size-4 accent-foreground"
              />
              {PAYMENT_METHOD_LABELS[method][locale]}
            </label>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {paymentMethod === "BANK_TRANSFER"
            ? { en: "Our team will send the bank transfer details after confirming your booking.", vi: "Chúng tôi sẽ gửi thông tin chuyển khoản sau khi xác nhận lịch hẹn.", ko: "예약 확정 후 계좌 이체 정보를 보내드립니다." }[locale]
            : { en: "Please pay in cash to the therapist after the service.", vi: "Vui lòng thanh toán tiền mặt cho kỹ thuật viên sau buổi dịch vụ.", ko: "서비스 후 관리사에게 현금으로 결제해 주세요." }[locale]}
        </p>
      </fieldset>

      {error && <p role="alert" className="text-sm text-destructive">{localizeBookingError(error, locale)}</p>}

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
