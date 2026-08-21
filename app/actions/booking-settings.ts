"use server"

import { db } from "@/lib/db"
import { bookingSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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

function clampRatePercent(raw: FormDataEntryValue | null): string {
  const n = Number(raw ?? 0)
  if (!Number.isFinite(n)) return "0"
  return (Math.min(Math.max(n, 0), 100) / 100).toString()
}

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]

export async function updateBookingSettings(_prevState: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()

  const advanceBookingDays = Number(formData.get("advanceBookingDays") ?? 30)
  const minNoticeHours = Number(formData.get("minNoticeHours") ?? 2)
  const maxGuests = Number(formData.get("maxGuests") ?? 20)
  const openTime = String(formData.get("openTime") ?? "09:00")
  const closeTime = String(formData.get("closeTime") ?? "21:00")

  if (!Number.isInteger(advanceBookingDays) || advanceBookingDays < 1 || advanceBookingDays > 365) {
    return { error: "Advance booking days must be between 1 and 365." }
  }
  if (!Number.isInteger(minNoticeHours) || minNoticeHours < 0 || minNoticeHours > 168) {
    return { error: "Minimum notice hours must be between 0 and 168." }
  }
  if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 50) {
    return { error: "Max guests must be between 1 and 50." }
  }
  if (!/^\d{2}:\d{2}$/.test(openTime) || !/^\d{2}:\d{2}$/.test(closeTime)) {
    return { error: "Invalid time format." }
  }

  const closedWeekdays = WEEKDAYS.filter((d) => formData.get(`closedWeekday_${d}`) === "on")

  const values = {
    advanceBookingDays,
    minNoticeHours,
    maxGuests,
    openTime,
    closeTime,
    closedWeekdays,
    groupDiscount2: clampRatePercent(formData.get("groupDiscount2")),
    groupDiscount3: clampRatePercent(formData.get("groupDiscount3")),
    groupDiscount4: clampRatePercent(formData.get("groupDiscount4")),
    firstTimeDiscount: clampRatePercent(formData.get("firstTimeDiscount")),
    updatedAt: new Date(),
  }

  const idValue = String(formData.get("id") ?? "")
  const id = idValue ? Number(idValue) : null

  if (id) {
    await db.update(bookingSettings).set(values).where(eq(bookingSettings.id, id))
  } else {
    await db.insert(bookingSettings).values(values)
  }

  revalidatePath("/admin/booking-settings")
  revalidatePath("/")
  return { error: undefined }
}
