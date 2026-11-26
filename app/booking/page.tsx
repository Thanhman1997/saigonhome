import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ServicesSection } from "@/components/sections/services"
import { BookingDialog } from "@/components/booking/booking-dialog"
import { BookingLanding } from "@/components/booking/booking-landing"
import { BookingProvider } from "@/lib/booking-context"
import { getAvailableTherapists, getBookingSettings, getContactInfo, getServicesWithDurations, getServicesContent } from "@/lib/data"
import { getNavigationSettings } from "@/lib/admin-data"
import { buildPageMetadata, getSeoContext } from "@/lib/seo"
import { seoCopy } from "@/lib/seo-copy"

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSeoContext()
  return buildPageMetadata({
    path: "/booking",
    ctx,
    title: seoCopy.booking.title[ctx.locale],
    description: seoCopy.booking.description[ctx.locale],
  })
}

export default async function BookingPage() {
  const [services, therapists, contactInfo, navigationSettings, servicesContent, bookingSettings] = await Promise.all([
    getServicesWithDurations(), getAvailableTherapists(), getContactInfo(), getNavigationSettings(), getServicesContent(), getBookingSettings(),
  ])

  return (
    <BookingProvider services={services} therapists={therapists} maxGuests={bookingSettings?.maxGuests}>
      <Header navigationSettings={navigationSettings} />
      <main>
        <BookingLanding />
        <ServicesSection services={services} content={servicesContent} fullPage headingLevel="h2" />
      </main>
      <Footer contactInfo={contactInfo} />
      <BookingDialog />
    </BookingProvider>
  )
}
