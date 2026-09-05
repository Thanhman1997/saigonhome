"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { navigationSettings } from "@/lib/db/schema"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

export type NavigationActionState = { success: boolean; error?: string }

export async function updateNavigationSettings(_prev: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  try { await assertAdmin() } catch { return { success: false, error: "Unauthorized" } }
  const raw = String(formData.get("items") ?? "[]")
  let items: unknown
  try { items = JSON.parse(raw) } catch { return { success: false, error: "Invalid navigation data" } }
  if (!Array.isArray(items) || items.length > 12) return { success: false, error: "Invalid navigation data" }
  try {
    for (const [index, item] of items.entries()) {
      if (!item || typeof item !== "object") return { success: false, error: "Invalid navigation item" }
      const value = item as Record<string, unknown>
      const menuKey = String(value.menuKey ?? "").slice(0, 40)
      const href = String(value.href ?? "#").slice(0, 200)
      if (!menuKey || !href.startsWith("#")) return { success: false, error: "Menu links must use section anchors" }
      const values = { menuKey, labelEn: String(value.labelEn ?? "").slice(0, 80), labelVi: String(value.labelVi ?? "").slice(0, 80), labelKo: String(value.labelKo ?? "").slice(0, 80), href, visible: value.visible !== false, sortOrder: index, fontFamily: String(value.fontFamily ?? "inherit"), fontSize: String(value.fontSize ?? "sm"), fontWeight: String(value.fontWeight ?? "normal"), textColor: String(value.textColor ?? "inherit"), hoverColor: String(value.hoverColor ?? "inherit"), updatedAt: new Date() }
      const existing = await db.select({ id: navigationSettings.id }).from(navigationSettings).where(eq(navigationSettings.menuKey, menuKey)).limit(1)
      if (existing[0]) await db.update(navigationSettings).set(values).where(eq(navigationSettings.id, existing[0].id))
      else await db.insert(navigationSettings).values(values)
    }
    revalidatePath("/")
    revalidatePath("/admin/design")
    return { success: true }
  } catch { return { success: false, error: "Could not save navigation settings" } }
}
