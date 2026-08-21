"use server"

import { db } from "@/lib/db"
import { membershipPlans } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) {
    throw new Error("Unauthorized")
  }
}

function slugifyKey(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function readMembershipForm(formData: FormData) {
  const nameEn = String(formData.get("nameEn") ?? "").trim()
  const nameKo = String(formData.get("nameKo") ?? "").trim()
  const nameVi = String(formData.get("nameVi") ?? "").trim()
  const descriptionEn = String(formData.get("descriptionEn") ?? "").trim()
  const descriptionKo = String(formData.get("descriptionKo") ?? "").trim()
  const descriptionVi = String(formData.get("descriptionVi") ?? "").trim()
  const benefitsRaw = String(formData.get("benefits") ?? "")
  const validityDaysRaw = String(formData.get("validityDays") ?? "").trim()
  const priceVndRaw = String(formData.get("priceVnd") ?? "0")
  const bonusVndRaw = String(formData.get("bonusVnd") ?? "0")

  if (!nameEn || !nameKo || !nameVi) {
    return { error: "Please fill in the plan name in all three languages." } as const
  }

  const priceVnd = Number(priceVndRaw)
  const bonusVnd = Number(bonusVndRaw)
  if (!Number.isFinite(priceVnd) || priceVnd <= 0) {
    return { error: "Price must be a positive number." } as const
  }
  if (!Number.isFinite(bonusVnd) || bonusVnd < 0) {
    return { error: "Bonus must be a non-negative number." } as const
  }
  const validityDays = validityDaysRaw ? Number(validityDaysRaw) : null
  if (validityDays !== null && (!Number.isFinite(validityDays) || validityDays <= 0)) {
    return { error: "Validity days must be a positive number." } as const
  }
  const benefits = benefitsRaw
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean)

  return {
    values: {
      nameEn,
      nameKo,
      nameVi,
      name: nameEn,
      descriptionEn,
      descriptionKo,
      descriptionVi,
      benefits,
      validityDays,
      priceVnd,
      bonusVnd,
    },
  } as const
}

export async function createMembershipPlan(_prevState: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()
  const parsed = readMembershipForm(formData)
  if ("error" in parsed) return parsed

  const all = await db.select().from(membershipPlans)
  const nextOrder = all.reduce((max, p) => Math.max(max, p.sortOrder), -1) + 1
  const baseKey = slugifyKey(parsed.values.nameEn) || "plan"
  let key = baseKey
  let suffix = 1
  while (all.some((p) => p.key === key)) {
    key = `${baseKey}-${suffix}`
    suffix += 1
  }

  await db.insert(membershipPlans).values({ ...parsed.values, key, sortOrder: nextOrder, active: true })

  revalidatePath("/admin/membership")
  revalidatePath("/")
  return { error: undefined }
}

export async function updateMembershipPlan(id: number, _prevState: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()
  const parsed = readMembershipForm(formData)
  if ("error" in parsed) return parsed

  await db.update(membershipPlans).set(parsed.values).where(eq(membershipPlans.id, id))

  revalidatePath("/admin/membership")
  revalidatePath("/")
  return { error: undefined }
}

export async function toggleMembershipPlanActive(id: number, active: boolean) {
  await assertAdmin()
  await db.update(membershipPlans).set({ active }).where(eq(membershipPlans.id, id))
  revalidatePath("/admin/membership")
  revalidatePath("/")
}

export async function deleteMembershipPlan(id: number) {
  await assertAdmin()
  await db.delete(membershipPlans).where(eq(membershipPlans.id, id))
  revalidatePath("/admin/membership")
  revalidatePath("/")
}
