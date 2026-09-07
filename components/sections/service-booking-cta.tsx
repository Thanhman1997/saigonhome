"use client"

import { Button } from "@/components/ui/button"
import { track } from "@vercel/analytics"
import { useBooking } from "@/lib/booking-context"

export function ServiceBookingCta({ serviceId, durationMinutes }: { serviceId: number; durationMinutes: number | null }) {
  const { openBooking } = useBooking()
  return <Button type="button" onClick={() => { track("booking_started", { source: "service_landing_page" }); openBooking({ serviceId, durationMinutes }) }} className="mt-8 rounded-full px-7 py-6 text-base font-semibold">Book this massage</Button>
}
