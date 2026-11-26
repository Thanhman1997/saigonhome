"use server"

import { revalidatePath, updateTag } from "next/cache"
import { LAYOUT_DATA_TAG } from "@/lib/data"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { sectionStyles } from "@/lib/db/schema"
import { assertAdmin } from "@/lib/admin-auth"
import { FONT_OPTIONS } from "@/lib/design-tokens"

const FONT_KEYS = new Set(["inherit", ...FONT_OPTIONS.map((font) => font.key)])
const HEADING_SIZES = new Set(["inherit", "1.5rem", "1.75rem", "2rem", "2.5rem", "3rem"])
const BODY_SIZES = new Set(["inherit", "0.875rem", "1rem", "1.125rem", "1.25rem", "1.5rem"])
const ALIGNMENTS = new Set(["left", "center", "right"])

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

export async function updateSectionStyle(formData: FormData) {
  await assertAdmin()

  const sectionKey = String(formData.get("sectionKey") ?? "")
  const headingFont = String(formData.get("headingFont") ?? "inherit")
  const headingSize = String(formData.get("headingSize") ?? "inherit")
  const headingColor = String(formData.get("headingColor") ?? "")
  const headingAlign = String(formData.get("headingAlign") ?? "center")
  const bodyFont = String(formData.get("bodyFont") ?? "inherit")
  const bodySize = String(formData.get("bodySize") ?? "inherit")
  const bodyColor = String(formData.get("bodyColor") ?? "")
  const bodyAlign = String(formData.get("bodyAlign") ?? "center")

  if (!/^[a-z-]+$/.test(sectionKey)) throw new Error("Invalid section")
  if (!FONT_KEYS.has(headingFont) || !FONT_KEYS.has(bodyFont)) throw new Error("Invalid font selection")
  if (!HEADING_SIZES.has(headingSize) || !BODY_SIZES.has(bodySize)) throw new Error("Invalid text size")
  if (!isHexColor(headingColor) || !isHexColor(bodyColor)) throw new Error("Colors must be valid hex values")
  if (!ALIGNMENTS.has(headingAlign) || !ALIGNMENTS.has(bodyAlign)) throw new Error("Invalid text alignment")

  const values = {
    sectionKey,
    titleFont: headingFont,
    titleSize: headingSize,
    titleColor: headingColor,
    titleAlign: headingAlign,
    bodyFont,
    bodySize,
    bodyColor,
    bodyAlign,
    updatedAt: new Date(),
  }

  const existing = await db.select({ sectionKey: sectionStyles.sectionKey }).from(sectionStyles).where(eq(sectionStyles.sectionKey, sectionKey)).limit(1)
  if (existing[0]) await db.update(sectionStyles).set(values).where(eq(sectionStyles.sectionKey, existing[0].sectionKey))
  else await db.insert(sectionStyles).values(values)

  updateTag(LAYOUT_DATA_TAG)
  revalidatePath("/", "layout")
  revalidatePath("/admin/content")
}
