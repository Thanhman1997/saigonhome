"use client"

import { BookingCtaButton } from "@/components/booking/booking-cta-button"
import { track } from "@vercel/analytics"
import { useBooking } from "@/lib/booking-context"
import { useLanguage } from "@/lib/i18n/language-provider"

export function ServiceBookingCta({ serviceId, durationMinutes }: { serviceId: number; durationMinutes: number | null }) {
  const { openBooking } = useBooking()
  const { t } = useLanguage()
  return <BookingCtaButton onClick={() => { track("booking_started", { source: "service_landing_page" }); openBooking({ serviceId, durationMinutes }) }} className="mt-8">{t.nav.book}</BookingCtaButton>
}
