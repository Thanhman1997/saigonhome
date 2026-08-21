"use server"

import { db } from "@/lib/db"
import { heroContent } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

export async function updateHero(_prev: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()
  const values = {
    kickerEn: String(formData.get("kickerEn") ?? "").trim(), kickerKo: String(formData.get("kickerKo") ?? "").trim(), kickerVi: String(formData.get("kickerVi") ?? "").trim(),
    titleLine1En: String(formData.get("titleLine1En") ?? "").trim(), titleLine1Ko: String(formData.get("titleLine1Ko") ?? "").trim(), titleLine1Vi: String(formData.get("titleLine1Vi") ?? "").trim(),
    titleLine2En: String(formData.get("titleLine2En") ?? "").trim(), titleLine2Ko: String(formData.get("titleLine2Ko") ?? "").trim(), titleLine2Vi: String(formData.get("titleLine2Vi") ?? "").trim(),
    subtitleEn: String(formData.get("subtitleEn") ?? "").trim(), subtitleKo: String(formData.get("subtitleKo") ?? "").trim(), subtitleVi: String(formData.get("subtitleVi") ?? "").trim(),
    ctaEn: String(formData.get("ctaEn") ?? "").trim(), ctaKo: String(formData.get("ctaKo") ?? "").trim(), ctaVi: String(formData.get("ctaVi") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "/images/spa-hero.png").trim(),
    visible: formData.get("publish") === "publish" ? true : formData.get("publish") === "draft" ? false : formData.get("visible") === "on",
    updatedAt: new Date(),
  }
  if (Object.values(values).some((value) => typeof value === "string" && !value)) return { error: "Please fill all hero fields." }
  const current = await db.select({ id: heroContent.id }).from(heroContent).limit(1)
  if (current[0]) await db.update(heroContent).set(values).where(eq(heroContent.id, current[0].id))
  else await db.insert(heroContent).values(values)
  revalidatePath("/")
  revalidatePath("/admin/hero")
  return { error: undefined }
}
