import { Header } from "@/components/header"

export const dynamic = "force-dynamic"
export const revalidate = 0
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/sections/hero"
import { AboutSection } from "@/components/sections/about"
import { ServicesSection } from "@/components/sections/services"
import { ExpertsSection } from "@/components/sections/experts"
import { Promotions } from "@/components/sections/promotions"
import { Membership } from "@/components/sections/membership"
import { Faq } from "@/components/sections/faq"
import { ContactSection } from "@/components/sections/contact"
import { BookingProvider } from "@/lib/booking-context"
import { BookingDialog } from "@/components/booking/booking-dialog"
import { AskQuestionWidget } from "@/components/ask-question-widget"
import {
  getServicesWithDurations,
  getAvailableTherapists,
  getTherapists,
  getActivePromotions,
  getMembershipPlans,
  getFaqs,
  getContactInfo,
  getHeroContent,
  getAboutContent,
  getLotusValues,
} from "@/lib/data"

export default async function Home() {
  const [services, allTherapists, availableTherapists, promotions, plans, faqs, contactInfo, hero, about, lotusValues] =
    await Promise.all([
      getServicesWithDurations(),
      getTherapists(),
      getAvailableTherapists(),
      getActivePromotions(),
      getMembershipPlans(),
      getFaqs(),
      getContactInfo(),
      getHeroContent(),
      getAboutContent(),
      getLotusValues(),
    ])

  return (
    <BookingProvider services={services} therapists={availableTherapists}>
      <main className="min-h-screen bg-background">
        <Header />
        <HeroSection hero={hero} />
        <AboutSection about={about} values={lotusValues} />
        <ServicesSection services={services} />
        <ExpertsSection therapists={allTherapists} />
        <Promotions promotions={promotions} />
        <Membership plans={plans} />
        <Faq faqs={faqs} />
        <ContactSection contactInfo={contactInfo} />
        <Footer />
      </main>
      <BookingDialog />
      <AskQuestionWidget />
    </BookingProvider>
  )
}
