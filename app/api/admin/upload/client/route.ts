import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { isAdminAuthenticated as isAdmin } from "@/lib/admin-auth"

const UPLOAD_PREFIX = "lotus-wellness/"
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const VIDEO_TYPES = ["video/mp4", "video/webm"]
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_VIDEO_BYTES = 150 * 1024 * 1024

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
        if (!pathname.startsWith(UPLOAD_PREFIX) || !/^[\w.\-/]+$/.test(pathname) || pathname.includes("..")) {
          throw new Error("Invalid upload path")
        }
        if (!/\.(jpe?g|png|gif|webp|mp4|webm)$/i.test(pathname)) {
          throw new Error("Unsupported file type")
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
