import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

const UPLOAD_PREFIX = "lotus-wellness/"
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const VIDEO_TYPES = ["video/mp4", "video/webm"]
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_VIDEO_BYTES = 150 * 1024 * 1024

async function isAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  return Boolean(expected) && token === expected
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as HandleUploadBody
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(UPLOAD_PREFIX) || pathname.includes("..")) {
          throw new Error("Invalid upload path")
        }
        const isVideo = /\.(mp4|webm)$/i.test(pathname)
        return {
          allowedContentTypes: isVideo ? VIDEO_TYPES : IMAGE_TYPES,
          maximumSizeInBytes: isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES,
          addRandomSuffix: true,
        }
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Client upload token error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 })
  }
}
