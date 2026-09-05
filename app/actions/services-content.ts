"use server"

import { db } from "@/lib/db"
import { servicesContent } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

export async function updateServicesContent(_prev: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()
  const values = {
    kickerEn: String(formData.get("kickerEn") ?? "").trim(), kickerKo: String(formData.get("kickerKo") ?? "").trim(), kickerVi: String(formData.get("kickerVi") ?? "").trim(),
    titleEn: String(formData.get("titleEn") ?? "").trim(), titleKo: String(formData.get("titleKo") ?? "").trim(), titleVi: String(formData.get("titleVi") ?? "").trim(),
    subtitleEn: String(formData.get("subtitleEn") ?? "").trim(), subtitleKo: String(formData.get("subtitleKo") ?? "").trim(), subtitleVi: String(formData.get("subtitleVi") ?? "").trim(),
    updatedAt: new Date(),
  }
  if (Object.values(values).some((value) => typeof value === "string" && !value)) return { error: "Please fill all Services content fields." }
  const current = await db.select({ id: servicesContent.id }).from(servicesContent).limit(1)
  if (current[0]) await db.update(servicesContent).set(values).where(eq(servicesContent.id, current[0].id))
  else await db.insert(servicesContent).values(values)
  revalidatePath("/")
  revalidatePath("/services")
  revalidatePath("/admin/services")
  return { error: undefined }
}

export async function getServicesContentAdmin() {
  await assertAdmin()
  const rows = await db.select().from(servicesContent).limit(1)
  return rows[0] ?? null
}
