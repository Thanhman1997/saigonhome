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
import { ReviewsSection } from "@/components/sections/reviews"
import { BookingProvider } from "@/lib/booking-context"
import { BookingDialog } from "@/components/booking/booking-dialog"
import { AskQuestionWidget } from "@/components/ask-question-widget"
import { getNavigationSettings } from "@/lib/admin-data"
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
  getApprovedReviews,
} from "@/lib/data"

export default async function Home() {
  const [services, allTherapists, availableTherapists, promotions, plans, faqs, contactInfo, navigationSettings, hero, about, lotusValues, reviews] =
    await Promise.all([
      getServicesWithDurations(),
      getTherapists(),
      getAvailableTherapists(),
      getActivePromotions(),
      getMembershipPlans(),
      getFaqs(),
      getContactInfo(),
      getNavigationSettings(),
      getHeroContent(),
      getAboutContent(),
      getLotusValues(),
      getApprovedReviews(),
    ])

  return (
    <BookingProvider services={services} therapists={availableTherapists}>
      <main className="min-h-screen bg-background">
        <Header navigationSettings={navigationSettings} />
        <HeroSection hero={hero} />
        <ServicesSection services={services} />
        <ExpertsSection therapists={allTherapists} />
        <Promotions promotions={promotions} />
        <AboutSection about={about} values={lotusValues} />
        <Membership plans={plans} />
        <Faq faqs={faqs} />
        <ReviewsSection reviews={reviews} />
        <ContactSection contactInfo={contactInfo} />
        <Footer contactInfo={contactInfo} />
      </main>
      <BookingDialog />
      <AskQuestionWidget />
    </BookingProvider>
  )
}
