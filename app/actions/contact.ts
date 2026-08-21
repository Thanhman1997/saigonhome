"use server"

import { db } from "@/lib/db"
import { contactInfo } from "@/lib/db/schema"
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

export async function updateContactInfo(_prevState: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()

  const phone = String(formData.get("phone") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()

  if (!phone || !email) {
    return { error: "Phone and email are required." }
  }

  const values = {
    phone,
    email,
    whatsappUrl: String(formData.get("whatsappUrl") ?? "").trim() || null,
    lineUrl: String(formData.get("lineUrl") ?? "").trim() || null,
    kakaoUrl: String(formData.get("kakaoUrl") ?? "").trim() || null,
    messengerUrl: String(formData.get("messengerUrl") ?? "").trim() || null,
    instagramUrl: String(formData.get("instagramUrl") ?? "").trim() || null,
    addressEn: String(formData.get("addressEn") ?? "").trim() || null,
    addressKo: String(formData.get("addressKo") ?? "").trim() || null,
    addressVi: String(formData.get("addressVi") ?? "").trim() || null,
    hoursEn: String(formData.get("hoursEn") ?? "").trim() || null,
    hoursKo: String(formData.get("hoursKo") ?? "").trim() || null,
    hoursVi: String(formData.get("hoursVi") ?? "").trim() || null,
    updatedAt: new Date(),
  }

  const idValue = String(formData.get("id") ?? "")
  const id = idValue ? Number(idValue) : null

  if (id) {
    await db.update(contactInfo).set(values).where(eq(contactInfo.id, id))
  } else {
    await db.insert(contactInfo).values(values)
  }

  revalidatePath("/admin/contact")
  revalidatePath("/")
  return { error: undefined }
}
