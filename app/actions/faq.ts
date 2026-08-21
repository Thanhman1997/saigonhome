"use server"

import { db } from "@/lib/db"
import { faqs } from "@/lib/db/schema"
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

function readFaqForm(formData: FormData) {
  const questionEn = String(formData.get("questionEn") ?? "").trim()
  const questionKo = String(formData.get("questionKo") ?? "").trim()
  const questionVi = String(formData.get("questionVi") ?? "").trim()
  const answerEn = String(formData.get("answerEn") ?? "").trim()
  const answerKo = String(formData.get("answerKo") ?? "").trim()
  const answerVi = String(formData.get("answerVi") ?? "").trim()

  if (!questionEn || !questionKo || !questionVi || !answerEn || !answerKo || !answerVi) {
    return { error: "Please fill in all required fields." } as const
  }

  return {
    values: { questionEn, questionKo, questionVi, answerEn, answerKo, answerVi },
  } as const
}

export async function createFaq(_prevState: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()
  const parsed = readFaqForm(formData)
  if ("error" in parsed) return parsed

  const maxOrder = await db.select().from(faqs)
  const nextOrder = maxOrder.reduce((max, f) => Math.max(max, f.sortOrder), -1) + 1

  await db.insert(faqs).values({ ...parsed.values, sortOrder: nextOrder, active: true })

  revalidatePath("/admin/faq")
  revalidatePath("/")
  return { error: undefined }
}

export async function updateFaq(id: number, _prevState: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()
  const parsed = readFaqForm(formData)
  if ("error" in parsed) return parsed

  await db.update(faqs).set(parsed.values).where(eq(faqs.id, id))

  revalidatePath("/admin/faq")
  revalidatePath("/")
  return { error: undefined }
}

export async function toggleFaqActive(id: number, active: boolean) {
  await assertAdmin()
  await db.update(faqs).set({ active }).where(eq(faqs.id, id))
  revalidatePath("/admin/faq")
  revalidatePath("/")
}

export async function deleteFaq(id: number) {
  await assertAdmin()
  await db.delete(faqs).where(eq(faqs.id, id))
  revalidatePath("/admin/faq")
  revalidatePath("/")
}

export async function moveFaq(id: number, direction: "up" | "down") {
  await assertAdmin()
  const all = await db.select().from(faqs).orderBy(faqs.sortOrder)
  const index = all.findIndex((f) => f.id === id)
  if (index === -1) return
  const swapIndex = direction === "up" ? index - 1 : index + 1
  if (swapIndex < 0 || swapIndex >= all.length) return

  const current = all[index]
  const swap = all[swapIndex]

  await db.update(faqs).set({ sortOrder: swap.sortOrder }).where(eq(faqs.id, current.id))
  await db.update(faqs).set({ sortOrder: current.sortOrder }).where(eq(faqs.id, swap.id))

  revalidatePath("/admin/faq")
  revalidatePath("/")
}
