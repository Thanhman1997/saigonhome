import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ServicesSection } from "@/components/sections/services"
import { BookingDialog } from "@/components/booking/booking-dialog"
import { BookingProvider } from "@/lib/booking-context"
import { getAvailableTherapists, getContactInfo, getServicesWithDurations, getServicesContent } from "@/lib/data"
import type { Metadata } from "next"
import { getNavigationSettings } from "@/lib/admin-data"

export const metadata: Metadata = {
  title: "Mobile Massage Services in Ho Chi Minh City | Lotus Wellness",
  description: "Explore professional mobile massage services delivered to your home or hotel in Ho Chi Minh City.",
  alternates: { canonical: "/services" },
}

export const dynamic = "force-dynamic"

export default async function ServicesPage() {
  const [services, therapists, contactInfo, navigationSettings, servicesContent] = await Promise.all([
    getServicesWithDurations(),
    getAvailableTherapists(),
    getContactInfo(),
    getNavigationSettings(),
    getServicesContent(),
  ])

  return (
    <BookingProvider services={services} therapists={therapists}>
      <main className="min-h-screen bg-background">
        <Header navigationSettings={navigationSettings} />
        <ServicesSection services={services} content={servicesContent} fullPage />
        <Footer contactInfo={contactInfo} />
      </main>
      <BookingDialog />
    </BookingProvider>
  )
}
