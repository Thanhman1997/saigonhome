"use server"

import { db } from "@/lib/db"
import { lotusValues } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"
import { LOTUS_VALUE_ICONS } from "@/lib/lotus-values"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

function readLotusValueForm(formData: FormData) {
  const textEn = String(formData.get("textEn") ?? "").trim()
  const textKo = String(formData.get("textKo") ?? "").trim()
  const textVi = String(formData.get("textVi") ?? "").trim()
  const icon = String(formData.get("icon") ?? "sparkles")

  if (!textEn || !textKo || !textVi) {
    return { error: "Please fill in the value text in all three languages." } as const
  }
  if (!LOTUS_VALUE_ICONS.includes(icon as (typeof LOTUS_VALUE_ICONS)[number])) {
    return { error: "Invalid icon." } as const
  }

  return { values: { textEn, textKo, textVi, icon } } as const
}

export async function createLotusValue(_prev: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()
  const parsed = readLotusValueForm(formData)
  if ("error" in parsed) return parsed

  const all = await db.select().from(lotusValues)
  const nextOrder = all.reduce((max, v) => Math.max(max, v.sortOrder), -1) + 1

  await db.insert(lotusValues).values({ ...parsed.values, sortOrder: nextOrder, active: true })

  revalidatePath("/admin/about")
  revalidatePath("/")
  return { error: undefined }
}

export async function updateLotusValue(id: number, _prev: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()
  const parsed = readLotusValueForm(formData)
  if ("error" in parsed) return parsed

  await db.update(lotusValues).set(parsed.values).where(eq(lotusValues.id, id))

  revalidatePath("/admin/about")
  revalidatePath("/")
  return { error: undefined }
}

export async function toggleLotusValueActive(id: number, active: boolean) {
  await assertAdmin()
  await db.update(lotusValues).set({ active }).where(eq(lotusValues.id, id))
  revalidatePath("/admin/about")
  revalidatePath("/")
}

export async function deleteLotusValue(id: number) {
  await assertAdmin()
  await db.delete(lotusValues).where(eq(lotusValues.id, id))
  revalidatePath("/admin/about")
  revalidatePath("/")
}

export async function reorderLotusValue(id: number, direction: "up" | "down") {
  await assertAdmin()
  const all = await db.select().from(lotusValues).orderBy(lotusValues.sortOrder)
  const idx = all.findIndex((v) => v.id === id)
  const swapIdx = direction === "up" ? idx - 1 : idx + 1
  if (idx === -1 || swapIdx < 0 || swapIdx >= all.length) return

  const current = all[idx]
  const swap = all[swapIdx]
  await db.update(lotusValues).set({ sortOrder: swap.sortOrder }).where(eq(lotusValues.id, current.id))
  await db.update(lotusValues).set({ sortOrder: current.sortOrder }).where(eq(lotusValues.id, swap.id))

  revalidatePath("/admin/about")
  revalidatePath("/")
}
