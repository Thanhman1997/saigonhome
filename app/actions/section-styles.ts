"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { sectionStyles } from "@/lib/db/schema"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"
import { cookies } from "next/headers"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

export async function updateSectionStyle(formData: FormData) {
  await assertAdmin()
  const sectionKey = String(formData.get("sectionKey") ?? "")
  const values = {
    sectionKey,
    titleColor: String(formData.get("headingColor") ?? ""),
    titleSize: String(formData.get("headingSize") ?? "md"),
    bodyColor: String(formData.get("bodyColor") ?? ""),
    bodySize: String(formData.get("bodySize") ?? "md"),
    updatedAt: new Date(),
  }
  if (!/^[a-z-]+$/.test(sectionKey)) throw new Error("Invalid section")
  const existing = await db.select({ sectionKey: sectionStyles.sectionKey }).from(sectionStyles).where(eq(sectionStyles.sectionKey, sectionKey)).limit(1)
  if (existing[0]) await db.update(sectionStyles).set(values).where(eq(sectionStyles.sectionKey, existing[0].sectionKey))
  else await db.insert(sectionStyles).values(values)
  revalidatePath("/", "layout")
  revalidatePath("/admin/content")
}
