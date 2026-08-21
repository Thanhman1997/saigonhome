"use server"

import { del } from "@vercel/blob"
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

export async function deleteMediaFile(url: string) {
  await assertAdmin()
  if (!url || !url.startsWith("https://")) {
    throw new Error("Invalid file URL")
  }
  await del(url)
  revalidatePath("/admin/media")
}
