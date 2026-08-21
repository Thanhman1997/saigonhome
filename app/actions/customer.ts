"use server"

import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function checkIsFirstTimeCustomer(email: string): Promise<boolean> {
  if (!email?.trim()) return false
  const existing = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.email, email.trim())).limit(1)
  return existing.length === 0
}
