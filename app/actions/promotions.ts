"use server"

import { db } from "@/lib/db"
import { events } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

const PROMOTION_TYPES = ["first_time", "combo", "seasonal"] as const
export type PromotionType = (typeof PROMOTION_TYPES)[number]

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) {
    throw new Error("Unauthorized")
  }
}

function readPromotionForm(formData: FormData) {
  const nameEn = String(formData.get("nameEn") ?? "").trim()
  const nameKo = String(formData.get("nameKo") ?? "").trim()
  const nameVi = String(formData.get("nameVi") ?? "").trim()
  const descEn = String(formData.get("descEn") ?? "").trim()
  const descKo = String(formData.get("descKo") ?? "").trim()
  const descVi = String(formData.get("descVi") ?? "").trim()
  const type = String(formData.get("type") ?? "seasonal")
  const discountLabel = String(formData.get("discountLabel") ?? "").trim()
  const discountType = String(formData.get("discountType") ?? "percent")
  const discountValue = String(formData.get("discountValue") ?? "0")
  const startDate = String(formData.get("startDate") ?? "").trim()
  const endDate = String(formData.get("endDate") ?? "").trim()
  const imageUrl = String(formData.get("imageUrl") ?? "").trim()

  if (!nameEn || !nameKo || !nameVi || !descEn || !descKo || !descVi) {
    return { error: "Please fill in all required fields." } as const
  }
  if (!PROMOTION_TYPES.includes(type as PromotionType)) {
    return { error: "Invalid promotion type." } as const
  }
  if (type === "seasonal" && (!startDate || !endDate)) {
    return { error: "Seasonal promotions require a start and end date." } as const
  }
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return { error: "End date must be after the start date." } as const
  }
  const discountNum = Number(discountValue)
  if (!Number.isFinite(discountNum) || discountNum <= 0) {
    return { error: "Discount value must be a positive number." } as const
  }

  return {
    values: {
      nameEn,
      nameKo,
      nameVi,
      descEn,
      descKo,
      descVi,
      type,
      discountLabel: discountLabel || null,
      discountType,
      discountValue: discountValue,
      startDate: type === "seasonal" ? startDate : null,
      endDate: type === "seasonal" ? endDate : null,
      imageUrl: imageUrl || null,
      applicableServiceIds: [] as number[],
    },
  } as const
}

export async function createPromotion(_prevState: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()
  const parsed = readPromotionForm(formData)
  if ("error" in parsed) return parsed

  const all = await db.select().from(events)
  const nextOrder = all.reduce((max, e) => Math.max(max, e.sortOrder), -1) + 1

  await db.insert(events).values({ ...parsed.values, sortOrder: nextOrder, active: true })

  revalidatePath("/admin/promotions")
  revalidatePath("/")
  return { error: undefined }
}

export async function updatePromotion(id: number, _prevState: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()
  const parsed = readPromotionForm(formData)
  if ("error" in parsed) return parsed

  await db.update(events).set(parsed.values).where(eq(events.id, id))

  revalidatePath("/admin/promotions")
  revalidatePath("/")
  return { error: undefined }
}

export async function togglePromotionActive(id: number, active: boolean) {
  await assertAdmin()
  await db.update(events).set({ active }).where(eq(events.id, id))
  revalidatePath("/admin/promotions")
  revalidatePath("/")
}

export async function deletePromotion(id: number) {
  await assertAdmin()
  await db.delete(events).where(eq(events.id, id))
  revalidatePath("/admin/promotions")
  revalidatePath("/")
}
