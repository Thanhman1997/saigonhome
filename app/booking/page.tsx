import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ServicesSection } from "@/components/sections/services"
import { BookingDialog } from "@/components/booking/booking-dialog"
import { BookingLanding } from "@/components/booking/booking-landing"
import { BookingProvider } from "@/lib/booking-context"
import { getAvailableTherapists, getContactInfo, getServicesWithDurations, getServicesContent } from "@/lib/data"
import { getNavigationSettings } from "@/lib/admin-data"

export const metadata: Metadata = {
  title: "Booking | Mobile Massage in Ho Chi Minh City",
  description: "Choose a Lotus Wellness massage, book a therapist, or find out how to manage your existing appointment.",
  alternates: { canonical: "/booking" },
}

export default async function BookingPage() {
  const [services, therapists, contactInfo, navigationSettings, servicesContent] = await Promise.all([
    getServicesWithDurations(), getAvailableTherapists(), getContactInfo(), getNavigationSettings(), getServicesContent(),
  ])

  return (
    <BookingProvider services={services} therapists={therapists}>
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
