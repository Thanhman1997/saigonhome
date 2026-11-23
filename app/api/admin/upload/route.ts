import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated as isAdmin } from "@/lib/admin-auth"
import { MEDIA_HEADER_BYTES, mediaMatchesDeclaredType } from "@/lib/media-signature"

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    const isVideo = file.type === "video/mp4" || file.type === "video/webm"
    const isImage = file.type.startsWith("image/")
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Only image, MP4, or WebM files are allowed" }, { status: 400 })
    }
    const maxSize = isVideo ? 150 * 1024 * 1024 : 8 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: isVideo ? "Video must be smaller than 150MB" : "Image must be smaller than 8MB" }, { status: 400 })
    }

    const header = new Uint8Array(await file.slice(0, MEDIA_HEADER_BYTES).arrayBuffer())
    if (!mediaMatchesDeclaredType(header, file.type)) {
      return NextResponse.json({ error: isVideo ? "Invalid video file" : "Invalid image file" }, { status: 400 })
    }

    const safeName = file.name.replace(/[^\w.\-]+/g, "-").slice(-80)
    const blob = await put(`lotus-wellness/${Date.now()}-${safeName}`, file, {
      access: "private",
      addRandomSuffix: true,
    })

    return NextResponse.json({ url: `/api/media?pathname=${encodeURIComponent(blob.pathname)}` })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
