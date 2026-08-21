"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { designSettings } from "@/lib/db/schema"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"
import { DESIGN_PRESETS } from "@/lib/design-tokens"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

export type DesignSettingsActionState = {
  success: boolean
  error?: string
}

const RADIUS_KEYS = new Set(["none", "sm", "md", "lg", "full"])
const SHADOW_KEYS = new Set(["none", "sm", "md", "lg"])
const SIZE_KEYS = new Set(["sm", "md", "lg", "xl"])
const WEIGHT_KEYS = new Set(["normal", "medium"])
const LINE_HEIGHT_KEYS = new Set(["tight", "normal", "relaxed"])
const FONT_KEYS = new Set(["cormorant", "dm-sans", "playfair", "dm-serif-display", "lora", "manrope", "inter"])

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

export async function updateDesignSettings(
  _prevState: DesignSettingsActionState,
  formData: FormData,
): Promise<DesignSettingsActionState> {
  try {
    await assertAdmin()
  } catch {
    return { success: false, error: "Unauthorized" }
  }

  const fontHeading = String(formData.get("fontHeading") ?? "")
  const fontBody = String(formData.get("fontBody") ?? "")
  const headingSize = String(formData.get("headingSize") ?? "")
  const bodySize = String(formData.get("bodySize") ?? "")
  const fontWeightBody = String(formData.get("fontWeightBody") ?? "")
  const lineHeight = String(formData.get("lineHeight") ?? "")
  const colorPrimary = String(formData.get("colorPrimary") ?? "")
  const colorSecondary = String(formData.get("colorSecondary") ?? "")
  const colorAccent = String(formData.get("colorAccent") ?? "")
  const colorLotusPink = String(formData.get("colorLotusPink") ?? "")
  const colorBackground = String(formData.get("colorBackground") ?? "")
  const colorForeground = String(formData.get("colorForeground") ?? "")
  const buttonRadius = String(formData.get("buttonRadius") ?? "")
  const buttonSize = String(formData.get("buttonSize") ?? "")
  const cardRadius = String(formData.get("cardRadius") ?? "")
  const cardShadow = String(formData.get("cardShadow") ?? "")
  const presetKey = String(formData.get("presetKey") ?? "custom")

  if (!FONT_KEYS.has(fontHeading) || !FONT_KEYS.has(fontBody)) {
    return { success: false, error: "Invalid font selection" }
  }
  if (!SIZE_KEYS.has(headingSize) || !SIZE_KEYS.has(bodySize) || !SIZE_KEYS.has(buttonSize)) {
    return { success: false, error: "Invalid size selection" }
  }
  if (!WEIGHT_KEYS.has(fontWeightBody)) return { success: false, error: "Invalid font weight" }
  if (!LINE_HEIGHT_KEYS.has(lineHeight)) return { success: false, error: "Invalid line height" }
  if (!RADIUS_KEYS.has(buttonRadius) || !RADIUS_KEYS.has(cardRadius)) {
    return { success: false, error: "Invalid radius selection" }
  }
  if (!SHADOW_KEYS.has(cardShadow)) return { success: false, error: "Invalid shadow selection" }
  for (const color of [colorPrimary, colorSecondary, colorAccent, colorLotusPink, colorBackground, colorForeground]) {
    if (!isHexColor(color)) return { success: false, error: "Colors must be valid hex values" }
  }

  const existing = await db.select({ id: designSettings.id }).from(designSettings).limit(1)

  const values = {
    fontHeading,
    fontBody,
    headingSize,
    bodySize,
    fontWeightBody,
    lineHeight,
    colorPrimary,
    colorSecondary,
    colorAccent,
    colorLotusPink,
    colorBackground,
    colorForeground,
    buttonRadius,
    buttonSize,
    cardRadius,
    cardShadow,
    presetKey,
    updatedAt: new Date(),
  }

  if (existing[0]) {
    await db.update(designSettings).set(values).where(eq(designSettings.id, existing[0].id))
  } else {
    await db.insert(designSettings).values(values)
  }

  revalidatePath("/", "layout")
  revalidatePath("/admin/design")
  return { success: true }
}

export async function resetDesignSettingsToPreset(presetKey: string): Promise<DesignSettingsActionState> {
  try {
    await assertAdmin()
  } catch {
    return { success: false, error: "Unauthorized" }
  }

  const preset = DESIGN_PRESETS.find((p) => p.key === presetKey)
  if (!preset) return { success: false, error: "Unknown preset" }

  const existing = await db.select({ id: designSettings.id }).from(designSettings).limit(1)
  const values = { ...preset.values, updatedAt: new Date() }

  if (existing[0]) {
    await db.update(designSettings).set(values).where(eq(designSettings.id, existing[0].id))
  } else {
    await db.insert(designSettings).values(values)
  }

  revalidatePath("/", "layout")
  revalidatePath("/admin/design")
  return { success: true }
}
