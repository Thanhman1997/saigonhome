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
import { asc, count, desc, eq, gte, sql } from "drizzle-orm"

export async function getDashboardCounts(today: string, weekStart: Date) {
  const [[todayRow], [weekRow], [pendingQuestionsRow], [pendingReviewsRow]] = await Promise.all([
    db.select({ total: count() }).from(bookings).where(eq(bookings.date, today)),
    db.select({ total: count() }).from(bookings).where(gte(bookings.createdAt, weekStart)),
    db.select({ total: count() }).from(questions).where(eq(questions.status, "pending")),
    db.select({ total: count() }).from(reviews).where(eq(reviews.approved, false)),
  ])

  return {
    todayBookings: todayRow?.total ?? 0,
    weekBookings: weekRow?.total ?? 0,
    pendingQuestions: pendingQuestionsRow?.total ?? 0,
    pendingReviews: pendingReviewsRow?.total ?? 0,
  }
}

export async function getAllBookingsWithRelations() {
  const [allBookings, allServices, allTherapists] = await Promise.all([
    db.select().from(bookings).orderBy(desc(bookings.createdAt)),
    db.select().from(services),
    db.select().from(therapists),
  ])
  const serviceById = new Map(allServices.map((s) => [s.id, s]))
  const therapistById = new Map(allTherapists.map((t) => [t.id, t]))

  return allBookings.map((booking) => ({
    ...booking,
    service: serviceById.get(booking.serviceId) ?? null,
    therapist: booking.therapistId ? (therapistById.get(booking.therapistId) ?? null) : null,
  }))
}

export async function getAllReviewsWithRelations() {
  const [allReviews, allTherapists] = await Promise.all([
    db.select().from(reviews).orderBy(desc(reviews.reviewDate)),
    db.select().from(therapists),
  ])
  const therapistById = new Map(allTherapists.map((t) => [t.id, t]))

  return allReviews.map((review) => ({
    ...review,
    therapist: review.therapistId ? (therapistById.get(review.therapistId) ?? null) : null,
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

export async function getExperienceVideoAdmin() {
  const rows = await db.select().from(siteContent).where(eq(siteContent.key, "experience_video")).limit(1)
  const value = rows[0]?.valueEn
  if (!value) return null
  try { return JSON.parse(value) as { videoUrl: string; thumbnailUrl: string | null; aspectRatio: number } } catch { return null }
}

export async function getAllTherapistsAdmin() {
  return db.select().from(therapists).orderBy(sql`CAST(NULLIF(regexp_replace(${therapists.code}, '[^0-9]', '', 'g'), '') AS INTEGER) ASC`)
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
  try {
    const rows = await db.select().from(designSettings).limit(1)
    return rows[0] ?? null
  } catch {
    return null
  }
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
