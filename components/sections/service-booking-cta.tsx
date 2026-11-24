"use client"

import { Button } from "@/components/ui/button"
import { track } from "@vercel/analytics"
import { useBooking } from "@/lib/booking-context"

export function ServiceBookingCta({ serviceId, durationMinutes }: { serviceId: number; durationMinutes: number | null }) {
  const { openBooking } = useBooking()
  return <Button type="button" onClick={() => { track("booking_started", { source: "service_landing_page" }); openBooking({ serviceId, durationMinutes }) }} className="mt-8 h-auto rounded-full px-8 py-3 text-lg font-semibold text-lotus-pink-foreground md:text-xl">BOOK NOW</Button>
}
