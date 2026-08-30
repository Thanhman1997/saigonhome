import { db } from "@/lib/db"
import {
  services,
  serviceDurations,
  bookings,
  therapists,
  reviews,
  events,
  membershipPlans,
  faqs,
  contactInfo,
  heroContent,
  aboutContent,
  lotusValues,
  designSettings,
  bookingSettings,
  siteContent,
} from "@/lib/db/schema"
import { asc, eq, desc, sql } from "drizzle-orm"

export async function getServicesWithDurations() {
  const allServices = await db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.sortOrder))
  const allDurations = await db.select().from(serviceDurations)

  return allServices.map((service) => ({
    ...service,
    durations: allDurations
      .filter((d) => d.serviceId === service.id)
      .sort((a, b) => a.minutes - b.minutes),
  }))
}

export async function getFeaturedServices() {
  const serviceList = await getServicesWithDurations()
  const since = new Date()
  since.setMonth(since.getMonth() - 1)
  const counts = await db
    .select({ serviceId: bookings.serviceId, bookingCount: sql<number>`count(*)` })
    .from(bookings)
    .where(sql`${bookings.createdAt} >= ${since} AND ${bookings.status} IN ('confirmed', 'completed')`)
    .groupBy(bookings.serviceId)
  const countMap = new Map(counts.map((row) => [row.serviceId, Number(row.bookingCount)]))
  return [...serviceList].sort((a, b) => (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0) || a.sortOrder - b.sortOrder).slice(0, 3)
}

export async function getTherapists() {
  return db.select().from(therapists).orderBy(asc(therapists.code))
}

export async function getAvailableTherapists() {
  return db.select().from(therapists).where(eq(therapists.available, true)).orderBy(asc(therapists.code))
}

export async function getApprovedReviews() {
  return db.select().from(reviews).where(eq(reviews.approved, true)).orderBy(desc(reviews.reviewDate))
}

export async function getActivePromotions() {
  const now = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const all = await db.select().from(events).where(eq(events.active, true)).orderBy(asc(events.sortOrder))
  return all.filter((e) => (!e.startDate || e.startDate <= now) && (!e.endDate || e.endDate >= now))
}

export async function getMembershipPlans() {
  return db.select().from(membershipPlans).where(eq(membershipPlans.active, true)).orderBy(asc(membershipPlans.priceVnd))
}

export async function getFaqs() {
  return db.select().from(faqs).where(eq(faqs.active, true)).orderBy(asc(faqs.sortOrder))
}

export async function getContactInfo() {
  const rows = await db.select().from(contactInfo).limit(1)
  return rows[0] ?? null
}

export async function getHeroContent() {
  const rows = await db.select().from(heroContent).limit(1)
  return rows[0] ?? null
}

export async function getAboutContent() {
  const rows = await db.select().from(aboutContent).where(eq(aboutContent.visible, true)).limit(1)
  return rows[0] ?? null
}

export async function getLotusValues() {
  return db.select().from(lotusValues).where(eq(lotusValues.active, true)).orderBy(asc(lotusValues.sortOrder))
}

export async function getDesignSettings() {
  const rows = await db.select().from(designSettings).limit(1)
  return rows[0] ?? null
}

export async function getBookingSettings() {
  const rows = await db.select().from(bookingSettings).limit(1)
  return rows[0] ?? null
}

const VALID_LOCALES = ["en", "ko", "vi"] as const
export type SiteLocale = (typeof VALID_LOCALES)[number]

export async function getDefaultLocale(): Promise<SiteLocale> {
  const rows = await db.select().from(siteContent).where(eq(siteContent.key, "default_locale")).limit(1)
  const value = rows[0]?.valueEn
  return (VALID_LOCALES as readonly string[]).includes(value ?? "") ? (value as SiteLocale) : "en"
}
