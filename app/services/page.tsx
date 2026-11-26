import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ServicesSection } from "@/components/sections/services"
import { BookingDialog } from "@/components/booking/booking-dialog"
import { BookingProvider } from "@/lib/booking-context"
import { getAvailableTherapists, getBookingSettings, getContactInfo, getServicesWithDurations, getServicesContent } from "@/lib/data"
import type { Metadata } from "next"
import { getNavigationSettings } from "@/lib/admin-data"
import { buildPageMetadata, getSeoContext } from "@/lib/seo"
import { seoCopy } from "@/lib/seo-copy"

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSeoContext()
  return buildPageMetadata({
    path: "/services",
    ctx,
    title: seoCopy.services.title[ctx.locale],
    description: seoCopy.services.description[ctx.locale],
  })
}

export const dynamic = "force-dynamic"

export default async function ServicesPage() {
  const [services, therapists, contactInfo, navigationSettings, servicesContent, bookingSettings] = await Promise.all([
    getServicesWithDurations(),
    getAvailableTherapists(),
    getContactInfo(),
    getNavigationSettings(),
    getServicesContent(),
    getBookingSettings(),
  ])

  return (
    <BookingProvider services={services} therapists={therapists} maxGuests={bookingSettings?.maxGuests}>
      <main className="min-h-screen bg-background">
        <Header navigationSettings={navigationSettings} />
        <ServicesSection services={services} content={servicesContent} fullPage />
        <Footer contactInfo={contactInfo} />
      </main>
      <BookingDialog />
    </BookingProvider>
  )
}
