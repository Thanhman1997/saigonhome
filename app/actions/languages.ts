"use server"

import { db } from "@/lib/db"
import { siteContent } from "@/lib/db/schema"
import { sql } from "drizzle-orm"
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

  revalidatePath("/admin/languages")
  revalidatePath("/")
  return { error: undefined }
}
