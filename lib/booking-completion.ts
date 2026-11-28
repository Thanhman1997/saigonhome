import { and, asc, eq, inArray, lte, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"

export const BOOKING_COMPLETION_BATCH_SIZE = 25

export async function completeOverdueConfirmedBookings(now = new Date()) {
  const candidates = await db.select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.status, "confirmed"), lte(bookings.endAt, now)))
    .orderBy(asc(bookings.endAt))
    .limit(BOOKING_COMPLETION_BATCH_SIZE)

  if (candidates.length === 0) return []

  const ids = candidates.map(({ id }) => id)
  const completedAt = now.toISOString()

  return db.update(bookings).set({
    status: "completed",
    updatedAt: now,
    activity: sql`${bookings.activity} || jsonb_build_array(jsonb_build_object('kind', 'completed', 'at', ${completedAt}, 'date', ${bookings.date}, 'time', ${bookings.time}, 'actor', 'system'))`,
  }).where(and(
    inArray(bookings.id, ids),
    eq(bookings.status, "confirmed"),
    lte(bookings.endAt, now),
  )).returning({
    id: bookings.id,
    email: bookings.email,
    reference: bookings.reference,
    locale: bookings.locale,
  })
}
