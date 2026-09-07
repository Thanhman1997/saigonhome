import { list } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

async function isAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  return Boolean(expected) && token === expected
}

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
