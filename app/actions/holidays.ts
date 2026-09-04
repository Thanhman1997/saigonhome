"use server"

import { db } from "@/lib/db"
import { vietnamHolidays } from "@/lib/db/schema"
import { asc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

export async function getHolidays(year: number) {
  return db.select().from(vietnamHolidays).where(eq(vietnamHolidays.year, year)).orderBy(asc(vietnamHolidays.date))
}

export type HolidaySyncState = { error?: string; count?: number }

export async function syncVietnamHolidays(_prev: HolidaySyncState, formData: FormData): Promise<HolidaySyncState> {
  await assertAdmin()
  const year = Number(formData.get("year"))
  if (!Number.isInteger(year) || year < 2020 || year > 2100) return { error: "Enter a valid year." }
  const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/VN`, { next: { revalidate: 86400 } })
  if (!response.ok) return { error: "Holiday API is unavailable. Please try again." }
  const holidays = (await response.json()) as Array<{ date: string; localName: string; name: string; fixed: boolean }>
  for (const holiday of holidays) {
    await db.insert(vietnamHolidays).values({ year, date: holiday.date, localName: holiday.localName, englishName: holiday.name, fixedDate: holiday.fixed, verified: false }).onConflictDoUpdate({ target: [vietnamHolidays.year, vietnamHolidays.date], set: { localName: holiday.localName, englishName: holiday.name, fixedDate: holiday.fixed, updatedAt: new Date() } })
  }
  revalidatePath("/admin/holidays")
  return { count: holidays.length }
}

export async function toggleHolidayVerified(id: number, verified: boolean) {
  await assertAdmin()
  await db.update(vietnamHolidays).set({ verified, updatedAt: new Date() }).where(eq(vietnamHolidays.id, id))
  revalidatePath("/admin/holidays")
}
