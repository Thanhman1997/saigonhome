import { get } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

const MAX_WIDTH = 1280
const CACHE_CONTROL = "public, max-age=31536000, immutable"
const RESIZABLE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname")
  if (!pathname || !pathname.startsWith("lotus-wellness/")) {
    return NextResponse.json({ error: "Invalid media path" }, { status: 400 })
  }

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })
    if (!result) return new NextResponse("Not found", { status: 404 })
    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: result.blob.etag, "Cache-Control": CACHE_CONTROL },
      })
    }

    const contentType = result.blob.contentType
    if (!RESIZABLE_TYPES.has(contentType)) {
      return new NextResponse(result.stream, {
        headers: { "Content-Type": contentType, ETag: result.blob.etag, "Cache-Control": CACHE_CONTROL },
      })
    }

    const original = Buffer.from(await new Response(result.stream).arrayBuffer())
    const optimized = await sharp(original)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    return new NextResponse(new Uint8Array(optimized), {
      headers: { "Content-Type": "image/webp", ETag: result.blob.etag, "Cache-Control": CACHE_CONTROL },
    })
  } catch (error) {
    console.error("[v0] Media delivery error:", error)
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 })
  }
}
