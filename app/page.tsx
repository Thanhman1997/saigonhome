import { HomepageRedesign } from "@/components/homepage-redesign"

export const dynamic = "force-dynamic"
export const revalidate = 0
import { BookingProvider } from "@/lib/booking-context"
import { BookingDialog } from "@/components/booking/booking-dialog"
import { AskQuestionWidget } from "@/components/ask-question-widget"
import {
  getServicesWithDurations,
  getAvailableTherapists,
  getTherapists,
  getApprovedReviews,
} from "@/lib/data"

export default async function Home() {
  const [services, allTherapists, availableTherapists, reviews] =
    await Promise.all([
      getServicesWithDurations(),
      getTherapists(),
      getAvailableTherapists(),
      getApprovedReviews(),
    ])

  return (
    <BookingProvider services={services} therapists={availableTherapists}>
      <HomepageRedesign services={services} therapists={allTherapists} reviews={reviews} />
      <BookingDialog />
      <AskQuestionWidget />
    </BookingProvider>
  )
}
