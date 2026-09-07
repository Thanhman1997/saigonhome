import { list } from "@vercel/blob"
import { db } from "@/lib/db"
import { dictionary } from "@/lib/i18n/dictionary"
import {
  services,
  servicesContent,
  serviceDurations,
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
  sectionStyles,
} from "@/lib/db/schema"
import { asc, eq, desc, sql } from "drizzle-orm"

export async function getLatestVideoMedia() {
  const { blobs } = await list({ prefix: "lotus-wellness/" })
  const video = blobs
    .filter((blob) => /\.(mp4|webm)$/i.test(blob.pathname))
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0]
  return video ? `/api/media?pathname=${encodeURIComponent(video.pathname)}` : null
}

export async function getServicesContent() {
  const rows = await db.select().from(servicesContent).limit(1)
  const row = rows[0]
  if (!row) return null

  // Keep legacy database rows from overwriting the canonical multilingual dictionary.
  return {
    ...row,
    kickerEn: row.kickerEn === "Therapies for every need" ? dictionary.en.services.kicker : row.kickerEn,
    kickerKo: row.kickerKo === "모든 니즈를 위한 테라피" ? dictionary.ko.services.kicker : row.kickerKo,
    kickerVi: row.kickerVi === "Liệu trình cho mọi nhu cầu" ? dictionary.vi.services.kicker : row.kickerVi,
  }
}

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
  return serviceList.slice(0, 3)
}

export async function getServiceBySlug(slug: string) {
  const serviceList = await getServicesWithDurations()
  return serviceList.find((service) => service.slug === slug) ?? null
}

export async function getTherapists() {
  return db.select().from(therapists).orderBy(sql`CAST(NULLIF(regexp_replace(${therapists.code}, '[^0-9]', '', 'g'), '') AS INTEGER) ASC`)
}

export async function getAvailableTherapists() {
  return db.select().from(therapists).where(eq(therapists.available, true)).orderBy(sql`CAST(NULLIF(regexp_replace(${therapists.code}, '[^0-9]', '', 'g'), '') AS INTEGER) ASC`)
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
  const all = await db.select().from(events).where(eq(events.active, true)).orderBy(asc(events.sortOrder), asc(events.startDate), asc(events.id))
  const seasonal = all.filter((event) => event.type === "seasonal")
  const currentSeasonal = seasonal.filter((event) => (!event.startDate || event.startDate <= now) && (!event.endDate || event.endDate >= now))
  if (currentSeasonal.length > 0) return [...currentSeasonal, ...all.filter((event) => event.type !== "seasonal" && (!event.startDate || event.startDate <= now) && (!event.endDate || event.endDate >= now))].slice(0, 3)

  const nextSeasonal = seasonal.find((event) => event.startDate && event.startDate > now)
  if (nextSeasonal) {
    const fallback = all.filter((event) => event.id !== nextSeasonal.id && event.type !== "seasonal" && (!event.startDate || event.startDate <= now) && (!event.endDate || event.endDate >= now)).slice(0, 2)
    return [nextSeasonal, ...fallback]
  }

  const current = all.filter((event) => (!event.startDate || event.startDate <= now) && (!event.endDate || event.endDate >= now))
  return current.slice(0, 3)
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

export async function getSectionStyles() {
  return db.select().from(sectionStyles)
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
