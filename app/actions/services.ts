"use server"

import { db } from "@/lib/db"
import { services, serviceDurations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function parseDurations(raw: string) {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  const result: { minutes: number; priceVnd: number }[] = []
  for (const line of lines) {
    const [minutesStr, priceStr] = line.split(",").map((s) => s.trim())
    const minutes = Number(minutesStr)
    const priceVnd = Number(priceStr)
    if (!Number.isFinite(minutes) || minutes <= 0 || !Number.isFinite(priceVnd) || priceVnd <= 0) {
      return { error: `Invalid duration line: "${line}". Use format "minutes, price" e.g. "60, 300000".` } as const
    }
    result.push({ minutes, priceVnd })
  }
  if (result.length === 0) {
    return { error: "Please add at least one duration and price." } as const
  }
  return { durations: result } as const
}

function readServiceForm(formData: FormData) {
  const nameEn = String(formData.get("nameEn") ?? "").trim()
  const nameKo = String(formData.get("nameKo") ?? "").trim()
  const nameVi = String(formData.get("nameVi") ?? "").trim()
  const descEn = String(formData.get("descEn") ?? "").trim()
  const descKo = String(formData.get("descKo") ?? "").trim()
  const descVi = String(formData.get("descVi") ?? "").trim()
  const icon = String(formData.get("icon") ?? "").trim() || "💆"
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null
  const durationsRaw = String(formData.get("durations") ?? "")

  if (!nameEn || !nameKo || !nameVi || !descEn || !descKo || !descVi) {
    return { error: "Please fill in all required fields in every language." } as const
  }

  const parsedDurations = parseDurations(durationsRaw)
  if ("error" in parsedDurations) return { error: parsedDurations.error } as const

  return {
    values: { nameEn, nameKo, nameVi, descEn, descKo, descVi, icon, imageUrl },
    durations: parsedDurations.durations,
  } as const
}

export async function createService(_prev: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()
  const parsed = readServiceForm(formData)
  if ("error" in parsed) return parsed

  const all = await db.select().from(services)
  const nextOrder = all.reduce((max, s) => Math.max(max, s.sortOrder), -1) + 1
  const baseSlug = slugify(parsed.values.nameEn) || "service"
  let slug = baseSlug
  let suffix = 1
  while (all.some((s) => s.slug === slug)) {
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }

  const [created] = await db
    .insert(services)
    .values({ ...parsed.values, slug, sortOrder: nextOrder, active: true })
    .returning({ id: services.id })

  await db.insert(serviceDurations).values(parsed.durations.map((d) => ({ ...d, serviceId: created.id })))

  revalidatePath("/admin/services")
  revalidatePath("/")
  return { error: undefined }
}

export async function updateService(id: number, _prev: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()
  const parsed = readServiceForm(formData)
  if ("error" in parsed) return parsed

  await db.update(services).set(parsed.values).where(eq(services.id, id))
  await db.delete(serviceDurations).where(eq(serviceDurations.serviceId, id))
  await db.insert(serviceDurations).values(parsed.durations.map((d) => ({ ...d, serviceId: id })))

  revalidatePath("/admin/services")
  revalidatePath("/")
  return { error: undefined }
}

export async function toggleServiceActive(id: number, active: boolean) {
  await assertAdmin()
  await db.update(services).set({ active }).where(eq(services.id, id))
  revalidatePath("/admin/services")
  revalidatePath("/")
}

export async function deleteService(id: number) {
  await assertAdmin()
  await db.delete(serviceDurations).where(eq(serviceDurations.serviceId, id))
  await db.delete(services).where(eq(services.id, id))
  revalidatePath("/admin/services")
  revalidatePath("/")
}

export async function reorderService(id: number, direction: "up" | "down") {
  await assertAdmin()
  const all = await db.select().from(services).orderBy(services.sortOrder)
  const idx = all.findIndex((s) => s.id === id)
  const swapIdx = direction === "up" ? idx - 1 : idx + 1
  if (idx === -1 || swapIdx < 0 || swapIdx >= all.length) return

  const current = all[idx]
  const swap = all[swapIdx]
  await db.update(services).set({ sortOrder: swap.sortOrder }).where(eq(services.id, current.id))
  await db.update(services).set({ sortOrder: current.sortOrder }).where(eq(services.id, swap.id))

  revalidatePath("/admin/services")
  revalidatePath("/")
}
