import type { Metadata } from "next"
import { BookingManagement } from "@/components/booking/booking-management"

export const metadata: Metadata = {
  title: "Manage your booking",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

export default function ManageBookingPage() {
  return <BookingManagement />
}
