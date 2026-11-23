"use server"

import { db } from "@/lib/db"
import { siteContent } from "@/lib/db/schema"
import { sql } from "drizzle-orm"
import { revalidatePath, updateTag } from "next/cache"
import { LAYOUT_DATA_TAG } from "@/lib/data"
import { assertAdmin } from "@/lib/admin-auth"

const VALID_LOCALES = ["en", "ko", "vi"] as const

export async function updateDefaultLocale(_prevState: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()

  const locale = String(formData.get("defaultLocale") ?? "en")
  if (!(VALID_LOCALES as readonly string[]).includes(locale)) {
    return { error: "Invalid language selection." }
  }

  await db
    .insert(siteContent)
    .values({ key: "default_locale", valueEn: locale, valueKo: locale, valueVi: locale, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteContent.key,
      set: { valueEn: locale, valueKo: locale, valueVi: locale, updatedAt: sql`now()` },
    })

  updateTag(LAYOUT_DATA_TAG)
  revalidatePath("/admin/languages")
  revalidatePath("/")
  return { error: undefined }
}
