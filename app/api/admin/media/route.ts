import { list } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated as isAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const search = request.nextUrl.searchParams.get("search")?.trim().toLowerCase() ?? ""
  const { blobs } = await list({ prefix: "lotus-wellness/" })
  const files = blobs
    .filter((blob) => /\.(avif|gif|jpe?g|png|webp)$/i.test(blob.pathname) && (!search || blob.pathname.toLowerCase().includes(search)))
    .map((blob) => ({
      url: `/api/media?pathname=${encodeURIComponent(blob.pathname)}`,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt.toISOString(),
      contentType: "image/*",
    }))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  return NextResponse.json({ files })
}
