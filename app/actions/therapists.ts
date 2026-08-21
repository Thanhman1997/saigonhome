"use server"

import { db } from "@/lib/db"
import { therapists } from "@/lib/db/schema"
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

function toIntOrNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim()
  if (!str) return null
  const num = Number(str)
  return Number.isFinite(num) ? Math.round(num) : null
}

export async function updateTherapist(id: number, _prevState: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()

  const code = String(formData.get("code") ?? "").trim()
  if (!code) {
    return { error: "Code is required." }
  }

  const values = {
    code,
    age: toIntOrNull(formData.get("age")),
    heightCm: toIntOrNull(formData.get("heightCm")),
    weightKg: toIntOrNull(formData.get("weightKg")),
    experienceYears: toIntOrNull(formData.get("experienceYears")),
    locationEn: String(formData.get("locationEn") ?? "").trim() || null,
    locationKo: String(formData.get("locationKo") ?? "").trim() || null,
    locationVi: String(formData.get("locationVi") ?? "").trim() || null,
    languages: String(formData.get("languages") ?? "").trim() || null,
    bioEn: String(formData.get("bioEn") ?? "").trim() || null,
    bioKo: String(formData.get("bioKo") ?? "").trim() || null,
    bioVi: String(formData.get("bioVi") ?? "").trim() || null,
    photoUrl: String(formData.get("photoUrl") ?? "").trim() || null,
    status: String(formData.get("status") ?? "draft").trim() || "draft",
    maxBookingsPerDay: Math.max(1, toIntOrNull(formData.get("maxBookingsPerDay")) ?? 4),
  }

  if (!["draft", "active", "inactive"].includes(values.status)) return { error: "Invalid therapist status." }
  if (values.status === "active") {
    const missing = [
      !values.photoUrl && "photo",
      !values.bioEn && "English bio",
      !values.bioKo && "Korean bio",
      !values.bioVi && "Vietnamese bio",
    ].filter(Boolean)
    if (missing.length) return { error: `Cannot publish: missing ${missing.join(", ")}.` }
  }

  await db.update(therapists).set(values).where(eq(therapists.id, id))

  revalidatePath("/admin/therapists")
  revalidatePath("/")
  return { error: undefined }
}

export async function toggleTherapistAvailable(id: number, available: boolean) {
  await assertAdmin()
  await db.update(therapists).set({ available }).where(eq(therapists.id, id))
  revalidatePath("/admin/therapists")
  revalidatePath("/")
}

export async function createTherapist(formData: FormData) {
  await assertAdmin()
  const code = String(formData.get("code") ?? "").trim()
  if (!code) throw new Error("Code is required.")
  await db.insert(therapists).values({ code, available: false, status: "draft", maxBookingsPerDay: 4, sortOrder: 0 })
  revalidatePath("/admin/therapists")
}

export async function archiveTherapist(id: number) {
  await assertAdmin()
  await db.update(therapists).set({ available: false, status: "inactive" }).where(eq(therapists.id, id))
  revalidatePath("/admin/therapists")
  revalidatePath("/")
}
