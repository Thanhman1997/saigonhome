"use server"

import { del } from "@vercel/blob"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { siteContent } from "@/lib/db/schema"
import { assertAdmin } from "@/lib/admin-auth"
import { getYouTubeVideoId } from "@/lib/youtube"

export async function deleteMediaFile(url: string) {
  await assertAdmin()
  if (!url || !url.startsWith("https://")) throw new Error("Invalid file URL")
  await del(url)
  revalidatePath("/admin/media")
}

function isValidThumbnailUrl(value: string | null) {
  if (!value) return true
  if (value.length > 2048) return false

  if (value.startsWith("/") && !value.startsWith("//")) {
    if (!value.startsWith("/api/media")) return true
    try {
      const parsed = new URL(value, "https://lotus-wellness.invalid")
      const pathname = parsed.searchParams.get("pathname")
      return parsed.pathname === "/api/media"
        && Boolean(pathname?.startsWith("lotus-wellness/"))
        && [...parsed.searchParams.keys()].every((key) => key === "pathname")
    } catch {
      return false
    }
  }

  try {
    const parsed = new URL(value)
    return parsed.protocol === "https:" && !parsed.username && !parsed.password
  } catch {
    return false
  }
}

export async function saveExperienceVideo(config: { videoUrl: string; thumbnailUrl: string | null; aspectRatio: number }) {
  await assertAdmin()
  if (config.thumbnailUrl !== null && typeof config.thumbnailUrl !== "string") throw new Error("Invalid thumbnail image")
  const thumbnailUrl = typeof config.thumbnailUrl === "string" ? config.thumbnailUrl.trim() || null : null
  if (!isValidThumbnailUrl(thumbnailUrl)) throw new Error("Choose a valid thumbnail image")
  if (!getYouTubeVideoId(config.videoUrl) || !Number.isFinite(config.aspectRatio) || config.aspectRatio <= 0) {
    throw new Error("A valid YouTube video link and aspect ratio are required")
  }
  const value = JSON.stringify({ videoUrl: config.videoUrl, thumbnailUrl, aspectRatio: config.aspectRatio })
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
