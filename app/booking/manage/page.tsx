import type { Metadata } from "next"
import { cookies } from "next/headers"
import { BookingManagement } from "@/components/booking/booking-management"
import { asBookingLocale, bookingManagementTitles } from "@/lib/booking-management-locale"

type Props = { searchParams: Promise<{ lang?: string | string[] }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const locale = asBookingLocale((await searchParams).lang) ?? asBookingLocale((await cookies()).get("lotus-wellness-locale")?.value) ?? "en"
  return {
    title: bookingManagementTitles[locale],
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  }
}

export default async function ManageBookingPage({ searchParams }: Props) {
  return <BookingManagement linkLocale={asBookingLocale((await searchParams).lang)} />
}
