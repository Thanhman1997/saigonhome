"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { sectionStyles } from "@/lib/db/schema"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"
import { FONT_OPTIONS } from "@/lib/design-tokens"
import { cookies } from "next/headers"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

export async function updateSectionStyle(formData: FormData) {
  await assertAdmin()
  const sectionKey = String(formData.get("sectionKey") ?? "")
  // Only accept font keys from the vetted FONT_OPTIONS pool (or "inherit") so an
  // arbitrary value can never be injected into the public font-family CSS.
  const allowedFonts = new Set<string>(["inherit", ...FONT_OPTIONS.map((f) => f.key)])
  const readFont = (name: string) => {
    const value = String(formData.get(name) ?? "inherit")
    return allowedFonts.has(value) ? value : "inherit"
  }
  const values = {
    sectionKey,
    titleFont: readFont("headingFont"),
    titleColor: String(formData.get("headingColor") ?? ""),
    titleSize: String(formData.get("headingSize") ?? "md"),
    bodyFont: readFont("bodyFont"),
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
