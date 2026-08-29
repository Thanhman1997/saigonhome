import { db } from "@/lib/db"
import {
  bookings,
  reviews,
  events,
  services,
  serviceDurations,
  therapists,
  faqs,
  contactInfo,
  heroContent,
  membershipPlans,
  aboutContent,
  lotusValues,
  designSettings,
  bookingSettings,
  siteContent,
  questions,
  navigationSettings,
} from "@/lib/db/schema"
import { asc, desc, eq } from "drizzle-orm"

export async function getAllBookingsWithRelations() {
  const allBookings = await db.select().from(bookings).orderBy(desc(bookings.createdAt))
  const allServices = await db.select().from(services)
  const allTherapists = await db.select().from(therapists)

  return allBookings.map((booking) => ({
    ...booking,
    service: allServices.find((s) => s.id === booking.serviceId) ?? null,
    therapist: allTherapists.find((t) => t.id === booking.therapistId) ?? null,
  }))
}

export async function getAllReviewsWithRelations() {
  const allReviews = await db.select().from(reviews).orderBy(desc(reviews.reviewDate))
  const allTherapists = await db.select().from(therapists)

  return allReviews.map((review) => ({
    ...review,
    therapist: allTherapists.find((t) => t.id === review.therapistId) ?? null,
  }))
}

export async function getAllEventsAdmin() {
  return db.select().from(events).orderBy(asc(events.sortOrder))
}

export async function getAllServicesAdmin() {
  const allServices = await db.select().from(services).orderBy(asc(services.sortOrder))
  const allDurations = await db.select().from(serviceDurations)

  return allServices.map((service) => ({
    ...service,
    durations: allDurations.filter((d) => d.serviceId === service.id).sort((a, b) => a.minutes - b.minutes),
  }))
}

export async function getAllFaqsAdmin() {
  return db.select().from(faqs).orderBy(asc(faqs.sortOrder))
}

export async function getContactInfoAdmin() {
  const rows = await db.select().from(contactInfo).limit(1)
  return rows[0] ?? null
}

export async function getAllTherapistsAdmin() {
  return db.select().from(therapists).orderBy(asc(therapists.sortOrder), asc(therapists.code))
}

export async function getHeroContentAdmin() {
  const rows = await db.select().from(heroContent).limit(1)
  return rows[0] ?? null
}

export async function getAllMembershipPlansAdmin() {
  return db.select().from(membershipPlans).orderBy(asc(membershipPlans.sortOrder))
}

export async function getAboutContentAdmin() {
  const rows = await db.select().from(aboutContent).limit(1)
  return rows[0] ?? null
}

export async function getAllLotusValuesAdmin() {
  return db.select().from(lotusValues).orderBy(asc(lotusValues.sortOrder))
}

export async function getNavigationSettingsAdmin() {
  return db.select().from(navigationSettings).orderBy(asc(navigationSettings.sortOrder))
}

export async function getNavigationSettings() {
  return db.select().from(navigationSettings).where(eq(navigationSettings.visible, true)).orderBy(asc(navigationSettings.sortOrder))
}

export async function getDesignSettingsAdmin() {
  const rows = await db.select().from(designSettings).limit(1)
  return rows[0] ?? null
}

export async function getBookingSettingsAdmin() {
  const rows = await db.select().from(bookingSettings).limit(1)
  return rows[0] ?? null
}

export async function getDefaultLocaleAdmin() {
  const rows = await db.select().from(siteContent).where(eq(siteContent.key, "default_locale")).limit(1)
  const value = rows[0]?.valueEn
  return value === "ko" || value === "vi" ? value : "en"
}

export async function getAllQuestions() {
  const all = await db.select().from(questions).orderBy(desc(questions.createdAt))
  return [...all].sort((a, b) => {
    if (a.status === b.status) return 0
    return a.status === "pending" ? -1 : 1
  })
}
