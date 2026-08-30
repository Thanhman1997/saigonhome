import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ServicesSection } from "@/components/sections/services"
import { BookingDialog } from "@/components/booking/booking-dialog"
import { BookingProvider } from "@/lib/booking-context"
import { getAvailableTherapists, getContactInfo, getServicesWithDurations } from "@/lib/data"
import { getNavigationSettings } from "@/lib/admin-data"

export const dynamic = "force-dynamic"

export default async function ServicesPage() {
  const [services, therapists, contactInfo, navigationSettings] = await Promise.all([
    getServicesWithDurations(),
    getAvailableTherapists(),
    getContactInfo(),
    getNavigationSettings(),
  ])

  return (
    <BookingProvider services={services} therapists={therapists}>
      <main className="min-h-screen bg-background">
        <Header navigationSettings={navigationSettings} />
        <div className="mx-auto w-full max-w-6xl px-5 pt-8 lg:px-8"><a href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">← Quay lại trang chủ</a></div>
        <ServicesSection services={services} fullPage />
        <Footer contactInfo={contactInfo} />
      </main>
      <BookingDialog />
    </BookingProvider>
  )
}
