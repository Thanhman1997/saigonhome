"use server"

import { db } from "@/lib/db"
import { aboutContent } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

function splitLines(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export async function updateAboutContent(_prev: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()

  const values = {
    titleEn: String(formData.get("titleEn") ?? "").trim(),
    titleKo: String(formData.get("titleKo") ?? "").trim(),
    titleVi: String(formData.get("titleVi") ?? "").trim(),
    bodyEn: splitLines(String(formData.get("bodyEn") ?? "")),
    bodyKo: splitLines(String(formData.get("bodyKo") ?? "")),
    bodyVi: splitLines(String(formData.get("bodyVi") ?? "")),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    visible: formData.get("visible") === "on",
    updatedAt: new Date(),
  }

  if (!values.titleEn || !values.titleKo || !values.titleVi) {
    return { error: "Please fill in the title in all three languages." }
  }

  const current = await db.select({ id: aboutContent.id }).from(aboutContent).limit(1)
  if (current[0]) {
    await db.update(aboutContent).set(values).where(eq(aboutContent.id, current[0].id))
  } else {
    await db.insert(aboutContent).values(values)
  }

  revalidatePath("/")
  revalidatePath("/admin/about")
  return { error: undefined }
}
