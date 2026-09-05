"use server"

import { db } from "@/lib/db"
import { siteContent } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

export async function saveAdminDraft(editor: string, locale: string, values: Record<string, string>) {
  await assertAdmin()
  const key = `draft:${editor}:${locale}`
  const payload = JSON.stringify(values)
  const existing = await db.select({ key: siteContent.key }).from(siteContent).where(eq(siteContent.key, key)).limit(1)
  if (existing[0]) await db.update(siteContent).set({ valueEn: payload, updatedAt: new Date() }).where(eq(siteContent.key, key))
  else await db.insert(siteContent).values({ key, valueEn: payload, valueKo: "", valueVi: "" })
  return { savedAt: new Date().toISOString() }
}

export async function loadAdminDraft(editor: string, locale: string) {
  await assertAdmin()
  const row = await db.select({ value: siteContent.valueEn }).from(siteContent).where(eq(siteContent.key, `draft:${editor}:${locale}`)).limit(1)
  if (!row[0]?.value) return null
  try { return JSON.parse(row[0].value) as Record<string, string> } catch { return null }
}
