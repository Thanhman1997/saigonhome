"use server"

import { db } from "@/lib/db"
import { bookingSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { assertAdmin } from "@/lib/admin-auth"
import { MAX_BOOKING_GUESTS } from "@/lib/booking-rules"

function clampRatePercent(raw: FormDataEntryValue | null): string {
  const n = Number(raw ?? 0)
  if (!Number.isFinite(n)) return "0"
  return (Math.min(Math.max(n, 0), 100) / 100).toString()
}

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]

export async function updateBookingSettings(_prevState: { error?: string } | undefined, formData: FormData) {
  await assertAdmin()

  const advanceBookingDays = Number(formData.get("advanceBookingDays") ?? 30)
  const maxGuests = Number(formData.get("maxGuests") ?? MAX_BOOKING_GUESTS)
  const openTime = String(formData.get("openTime") ?? "09:00")
  const closeTime = String(formData.get("closeTime") ?? "21:00")

  if (!Number.isInteger(advanceBookingDays) || advanceBookingDays < 1 || advanceBookingDays > 365) {
    return { error: "Advance booking days must be between 1 and 365." }
  }
  if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > MAX_BOOKING_GUESTS) {
    return { error: `Max guests must be between 1 and ${MAX_BOOKING_GUESTS}.` }
  }
  const isValidClockTime = (value: string) => {
    const match = /^(\d{2}):(\d{2})$/.exec(value)
    return Boolean(match && Number(match[1]) < 24 && Number(match[2]) < 60)
  }
  if (!isValidClockTime(openTime) || !isValidClockTime(closeTime)) {
    return { error: "Invalid time format." }
  }

  const closedWeekdays = WEEKDAYS.filter((d) => formData.get(`closedWeekday_${d}`) === "on")

  const values = {
    advanceBookingDays,
    minNoticeHours: 1,
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
  revalidatePath("/booking")
  revalidatePath("/services")
  revalidatePath("/services/[slug]", "page")
  return { error: undefined }
}
