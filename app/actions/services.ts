"use server"

import { db } from "@/lib/db"
import { bookings, services, serviceDurations } from "@/lib/db/schema"
import { asc, count, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { assertAdmin } from "@/lib/admin-auth"

export type ServiceActionResult = { error?: string }

const SERVICES_LOCK_KEY = 482_001
const MAX_DURATIONS = 12
const MIN_MINUTES = 5
const MAX_MINUTES = 480
const MAX_PRICE_VND = 100_000_000
const NAME_MAX = 120
const DESC_MAX = 2000
const ICON_MAX = 16
const URL_MAX = 2048

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
}

function isUniqueViolation(error: unknown) {
  const code = (error as { code?: string; cause?: { code?: string } } | null)
  return code?.code === "23505" || code?.cause?.code === "23505"
}

function isForeignKeyViolation(error: unknown) {
  const code = (error as { code?: string; cause?: { code?: string } } | null)
  return code?.code === "23503" || code?.cause?.code === "23503"
}

function isValidImageUrl(value: string) {
  if (value.length > URL_MAX) return false
  if (value.startsWith("/") && !value.startsWith("//")) return true
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

function parseDurations(raw: string) {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return { error: "Please add at least one duration and price." } as const
  if (lines.length > MAX_DURATIONS) return { error: `Use at most ${MAX_DURATIONS} durations.` } as const

  const result: { minutes: number; priceVnd: number }[] = []
  const seen = new Set<number>()
  for (const line of lines) {
    const [minutesStr, priceStr, ...extra] = line.split(",").map((s) => s.trim())
    const minutes = Number(minutesStr)
    const priceVnd = Number(priceStr)
    const formatOk = extra.length === 0 && minutesStr !== "" && priceStr !== undefined && priceStr !== ""
    if (
      !formatOk ||
      !Number.isInteger(minutes) || minutes < MIN_MINUTES || minutes > MAX_MINUTES ||
      !Number.isInteger(priceVnd) || priceVnd <= 0 || priceVnd > MAX_PRICE_VND
    ) {
      return {
        error: `Invalid duration line: "${line}". Use "minutes, price" with whole numbers, minutes ${MIN_MINUTES}-${MAX_MINUTES}, e.g. "60, 300000".`,
      } as const
    }
    if (seen.has(minutes)) return { error: `Duration ${minutes} minutes is listed more than once.` } as const
    seen.add(minutes)
    result.push({ minutes, priceVnd })
  }
  return { durations: result } as const
}

function readServiceForm(formData: FormData) {
  const read = (key: string) => String(formData.get(key) ?? "").trim()
  const nameEn = read("nameEn")
  const nameKo = read("nameKo")
  const nameVi = read("nameVi")
  const descEn = read("descEn")
  const descKo = read("descKo")
  const descVi = read("descVi")
  const icon = read("icon") || "💆"
  const imageUrl = read("imageUrl") || null
  const durationsRaw = String(formData.get("durations") ?? "")

  if (!nameEn || !nameKo || !nameVi || !descEn || !descKo || !descVi) {
    return { error: "Please fill in all required fields in every language." } as const
  }
  if ([nameEn, nameKo, nameVi].some((value) => value.length > NAME_MAX)) {
    return { error: `Names must be ${NAME_MAX} characters or fewer.` } as const
  }
  if ([descEn, descKo, descVi].some((value) => value.length > DESC_MAX)) {
    return { error: `Descriptions must be ${DESC_MAX} characters or fewer.` } as const
  }
  if (icon.length > ICON_MAX) return { error: `Icon must be ${ICON_MAX} characters or fewer.` } as const
  if (imageUrl && !isValidImageUrl(imageUrl)) {
    return { error: "Image must be an https URL or a path starting with /." } as const
  }

  const parsedDurations = parseDurations(durationsRaw)
  if ("error" in parsedDurations) return { error: parsedDurations.error } as const

  return {
    values: { nameEn, nameKo, nameVi, descEn, descKo, descVi, icon, imageUrl },
    durations: parsedDurations.durations,
  } as const
}

function revalidateServices() {
  revalidatePath("/admin/services")
  revalidatePath("/")
  revalidatePath("/services")
  revalidatePath("/sitemap.xml")
}

export async function createService(_prev: ServiceActionResult | undefined, formData: FormData): Promise<ServiceActionResult> {
  await assertAdmin()
  const parsed = readServiceForm(formData)
  if ("error" in parsed) return parsed

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${SERVICES_LOCK_KEY})`)
      const existing = await tx.select({ slug: services.slug, sortOrder: services.sortOrder }).from(services)
      const nextOrder = existing.reduce((max, s) => Math.max(max, s.sortOrder), -1) + 1
      const taken = new Set(existing.map((s) => s.slug))
      const baseSlug = slugify(parsed.values.nameEn) || "service"
      let slug = baseSlug
      for (let suffix = 1; taken.has(slug); suffix += 1) slug = `${baseSlug}-${suffix}`

      const [created] = await tx
        .insert(services)
        .values({ ...parsed.values, slug, sortOrder: nextOrder, active: true })
        .returning({ id: services.id })
      await tx.insert(serviceDurations).values(parsed.durations.map((d) => ({ ...d, serviceId: created.id })))
    })
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "A service with this name already exists. Please try again." }
    console.error("Service could not be created", error instanceof Error ? error.message : "unknown")
    return { error: "The service could not be saved. Please try again." }
  }

  revalidateServices()
  return { error: undefined }
}

export async function updateService(id: number, _prev: ServiceActionResult | undefined, formData: FormData): Promise<ServiceActionResult> {
  await assertAdmin()
  if (!Number.isInteger(id) || id <= 0) return { error: "Service not found." }
  const parsed = readServiceForm(formData)
  if ("error" in parsed) return parsed

  try {
    const found = await db.transaction(async (tx) => {
      const [current] = await tx.select({ id: services.id }).from(services).where(eq(services.id, id)).limit(1).for("update")
      if (!current) return false
      await tx.update(services).set(parsed.values).where(eq(services.id, id))
      await tx.delete(serviceDurations).where(eq(serviceDurations.serviceId, id))
      await tx.insert(serviceDurations).values(parsed.durations.map((d) => ({ ...d, serviceId: id })))
      return true
    })
    if (!found) return { error: "Service not found." }
  } catch (error) {
    console.error("Service could not be updated", error instanceof Error ? error.message : "unknown")
    return { error: "The service could not be saved. Please try again." }
  }

  revalidateServices()
  revalidatePath(`/services`, "layout")
  return { error: undefined }
}

export async function toggleServiceActive(id: number, active: boolean): Promise<ServiceActionResult> {
  await assertAdmin()
  if (!Number.isInteger(id) || id <= 0 || typeof active !== "boolean") return { error: "Invalid request." }
  await db.update(services).set({ active }).where(eq(services.id, id))
  revalidateServices()
  return {}
}

export async function deleteService(id: number): Promise<ServiceActionResult> {
  await assertAdmin()
  if (!Number.isInteger(id) || id <= 0) return { error: "Service not found." }

  try {
    const outcome = await db.transaction(async (tx) => {
      const [current] = await tx.select({ id: services.id }).from(services).where(eq(services.id, id)).limit(1).for("update")
      if (!current) return "missing" as const
      const [{ value: bookingCount }] = await tx.select({ value: count() }).from(bookings).where(eq(bookings.serviceId, id))
      if (bookingCount > 0) return "has_bookings" as const
      await tx.delete(serviceDurations).where(eq(serviceDurations.serviceId, id))
      await tx.delete(services).where(eq(services.id, id))
      return "deleted" as const
    })
    if (outcome === "missing") return { error: "Service not found." }
    if (outcome === "has_bookings") {
      return { error: "This service has booking history and cannot be deleted. Switch it to Inactive to hide it from the site instead." }
    }
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { error: "This service has booking history and cannot be deleted. Switch it to Inactive to hide it from the site instead." }
    }
    console.error("Service could not be deleted", error instanceof Error ? error.message : "unknown")
    return { error: "The service could not be deleted. Please try again." }
  }

  revalidateServices()
  return {}
}

export async function reorderService(id: number, direction: "up" | "down"): Promise<ServiceActionResult> {
  await assertAdmin()
  if (!Number.isInteger(id) || id <= 0 || (direction !== "up" && direction !== "down")) return { error: "Invalid request." }

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${SERVICES_LOCK_KEY})`)
    const all = await tx.select({ id: services.id, sortOrder: services.sortOrder }).from(services).orderBy(asc(services.sortOrder), asc(services.id))
    const idx = all.findIndex((s) => s.id === id)
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (idx === -1 || swapIdx < 0 || swapIdx >= all.length) return

    // Renumber the whole list so duplicate sort_order values can never make a swap a no-op.
    const reordered = [...all]
    ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]
    for (const [position, service] of reordered.entries()) {
      if (service.sortOrder !== position) await tx.update(services).set({ sortOrder: position }).where(eq(services.id, service.id))
    }
  })

  revalidateServices()
  return {}
}
