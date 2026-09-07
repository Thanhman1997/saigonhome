"use server"

import { db } from "@/lib/db"
import { siteContent } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

type DraftEnvelope = {
  editor: string
  identity: string
  values: Record<string, unknown>
  savedAt: string
  serverUpdatedAt?: string | null
}

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

function draftKey(editor: string, identity: string) {
  return `draft:${editor}:${identity}`
}

export async function saveAdminDraft(editor: string, identity: string, values: Record<string, unknown>, serverUpdatedAt?: string | null) {
  await assertAdmin()
  const savedAt = new Date().toISOString()
  const envelope: DraftEnvelope = { editor, identity, values, savedAt, serverUpdatedAt }
  const key = draftKey(editor, identity)
  const payload = JSON.stringify(envelope)
  const existing = await db.select({ key: siteContent.key }).from(siteContent).where(eq(siteContent.key, key)).limit(1)
  if (existing[0]) await db.update(siteContent).set({ valueEn: payload, updatedAt: new Date() }).where(eq(siteContent.key, key))
  else await db.insert(siteContent).values({ key, valueEn: payload, valueKo: "", valueVi: "" })
  return { savedAt }
}

export async function loadAdminDraft(editor: string, identity: string, serverUpdatedAt?: string | null) {
  await assertAdmin()
  const row = await db.select({ valueEn: siteContent.valueEn, updatedAt: siteContent.updatedAt }).from(siteContent).where(eq(siteContent.key, draftKey(editor, identity))).limit(1)
  if (!row[0]?.valueEn) return null
  try {
    const parsed = JSON.parse(row[0].valueEn) as DraftEnvelope
    if (parsed.editor !== editor || parsed.identity !== identity) return null
    if (serverUpdatedAt && parsed.serverUpdatedAt && new Date(serverUpdatedAt) > new Date(parsed.serverUpdatedAt)) return null
    return parsed
  } catch { return null }
}

export async function clearAdminDraft(editor: string, identity: string) {
  await assertAdmin()
  await db.delete(siteContent).where(and(eq(siteContent.key, draftKey(editor, identity))))
  return { cleared: true }
}

export async function discardAdminDraft(editor: string, identity: string) {
  return clearAdminDraft(editor, identity)
}

export type { DraftEnvelope }
