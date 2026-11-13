"use server"

import { del } from "@vercel/blob"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { siteContent } from "@/lib/db/schema"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

export async function deleteMediaFile(url: string) {
  await assertAdmin()
  if (!url || !url.startsWith("https://")) throw new Error("Invalid file URL")
  await del(url)
  revalidatePath("/admin/media")
}

export async function saveExperienceVideo(config: { videoUrl: string; thumbnailUrl: string | null; aspectRatio: number }) {
  await assertAdmin()
  if (!config.videoUrl || !Number.isFinite(config.aspectRatio) || config.aspectRatio <= 0) {
    throw new Error("A video and a valid aspect ratio are required")
  }
  const value = JSON.stringify({ videoUrl: config.videoUrl, thumbnailUrl: config.thumbnailUrl || null, aspectRatio: config.aspectRatio })
  await db.insert(siteContent).values({ key: "experience_video", valueEn: value, valueKo: value, valueVi: value, updatedAt: new Date() }).onConflictDoUpdate({
    target: siteContent.key,
    set: { valueEn: value, valueKo: value, valueVi: value, updatedAt: new Date() },
  })
  revalidatePath("/admin/video")
  revalidatePath("/admin/media")
  revalidatePath("/")
}

export async function clearExperienceVideo() {
  await assertAdmin()
  await db.delete(siteContent).where(eq(siteContent.key, "experience_video"))
  revalidatePath("/admin/video")
  revalidatePath("/")
}
