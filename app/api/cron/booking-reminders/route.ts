import { NextRequest, NextResponse } from "next/server"
import { and, eq, isNotNull, isNull, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { bookings, services, therapists } from "@/lib/db/schema"
import { hasValidCronSecret } from "@/lib/cron-auth"
import { sendBookingManagementEmail } from "@/lib/booking-management-email"
import { localizedServiceName } from "@/lib/booking-management-locale"

export const runtime = "nodejs"
export const maxDuration = 60

// A claim older than this is treated as a crashed run and may be retried.
const CLAIM_TIMEOUT_MINUTES = 15

export async function GET(request: NextRequest) {
  if (!hasValidCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ sent: 0, skipped: "Resend not configured" })

  const now = sql`CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`
  const eligible = and(
    eq(bookings.status, "confirmed"),
    isNull(bookings.reminderEmailSentAt),
    isNotNull(bookings.email),
    sql`${bookings.startAt} >= ${now}`,
    lt(bookings.startAt, sql`${now} + INTERVAL '25 hours'`),
  )
  const candidates = await db.select({ id: bookings.id }).from(bookings).where(eligible).limit(100)

  let sent = 0
  for (const { id } of candidates) {
    // Claim first so two overlapping runs can never both send; the lock is released before the slow email call.
    const claimed = await db.transaction(async (tx) => {
      const [booking] = await tx.select().from(bookings).where(and(eligible, eq(bookings.id, id))).limit(1).for("update", { skipLocked: true })
      if (!booking) return null
      await tx.update(bookings).set({ reminderEmailSentAt: new Date() }).where(eq(bookings.id, id))
      return booking
    })
    if (!claimed) continue

    let delivered = false
    try {
      const [service] = await db.select().from(services).where(eq(services.id, claimed.serviceId)).limit(1)
      const [therapist] = claimed.therapistId ? await db.select({ code: therapists.code }).from(therapists).where(eq(therapists.id, claimed.therapistId)).limit(1) : []
      const locale = claimed.locale ?? "en"
      delivered = await sendBookingManagementEmail(claimed, localizedServiceName(service, locale), "reminder", locale, { therapist: therapist?.code })
    } catch (error) {
      console.error("Booking reminder failed", { bookingId: id, error: error instanceof Error ? error.message : "unknown" })
    }

    if (delivered) {
      sent++
    } else {
      // Release the claim so the next run retries.
      await db.update(bookings).set({ reminderEmailSentAt: null }).where(and(eq(bookings.id, id), sql`${bookings.reminderEmailSentAt} > ${now} - ${`${CLAIM_TIMEOUT_MINUTES} minutes`}::interval`))
    }
  }
  return NextResponse.json({ sent, checked: candidates.length })
}
