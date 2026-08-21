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
} from "@/lib/db/schema"
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm"

export type BookingFilters = {
  search?: string
  status?: string
  therapistId?: number
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export async function getAllBookingsWithRelations(filters: BookingFilters = {}) {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25))
  const search = filters.search?.trim()
  const conditions = [
    search ? or(ilike(bookings.reference, `%${search}%`), ilike(bookings.customerName, `%${search}%`), ilike(bookings.email, `%${search}%`), ilike(bookings.phone, `%${search}%`)) : undefined,
    filters.status ? eq(bookings.status, filters.status) : undefined,
    filters.therapistId ? eq(bookings.therapistId, filters.therapistId) : undefined,
    filters.from ? gte(bookings.date, filters.from) : undefined,
    filters.to ? lte(bookings.date, filters.to) : undefined,
  ].filter(Boolean)
  const where = conditions.length ? and(...conditions) : undefined
  const allBookings = await db.select().from(bookings).where(where).orderBy(desc(bookings.date), desc(bookings.time)).limit(pageSize).offset((page - 1) * pageSize)
  const allServices = await db.select().from(services)
  const allTherapists = await db.select().from(therapists)

  return {
    rows: allBookings.map((booking) => ({
      ...booking,
      service: allServices.find((s) => s.id === booking.serviceId) ?? null,
      therapist: allTherapists.find((t) => t.id === booking.therapistId) ?? null,
    })),
    page,
    pageSize,
    hasNextPage: allBookings.length === pageSize,
  }
}

export async function getAdminDashboardMetrics() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date())
  const [todayRows, pendingRows, cancelledRows, revenueRows, therapistRows, questionRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.date, today)),
    db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.status, "cancelled")),
    db.select({ total: sql<number>`coalesce(sum(${bookings.totalVnd}), 0)` }).from(bookings).where(sql`${bookings.status} not in ('cancelled', 'no_show')`),
    db.select({ count: sql<number>`count(*)` }).from(therapists).where(and(eq(therapists.available, true), eq(therapists.status, "active"))),
    db.select({ count: sql<number>`count(*)` }).from(questions).where(eq(questions.status, "pending")),
  ])
  return {
    todayBookings: Number(todayRows[0]?.count ?? 0),
    pendingBookings: Number(pendingRows[0]?.count ?? 0),
    cancelledBookings: Number(cancelledRows[0]?.count ?? 0),
    revenueVnd: Number(revenueRows[0]?.total ?? 0),
    availableTherapists: Number(therapistRows[0]?.count ?? 0),
    unansweredQuestions: Number(questionRows[0]?.count ?? 0),
  }
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
