import { NextRequest, NextResponse } from "next/server"
import { and, eq, isNull, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { bookings, services, therapists } from "@/lib/db/schema"
import { sendBookingManagementEmail } from "@/lib/booking-management-email"
import { localizedServiceName } from "@/lib/booking-management-locale"

export async function GET(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ sent: 0, skipped: "Resend not configured" })

  const now = sql`CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`
  const eligible = and(eq(bookings.status, "confirmed"), isNull(bookings.reminderEmailSentAt), sql`${bookings.startAt} >= ${now}`, lt(bookings.startAt, sql`${now} + INTERVAL '25 hours'`))
  const candidates = await db.select({ id: bookings.id }).from(bookings).where(eligible).limit(100)

  let sent = 0
  for (const { id } of candidates) {
    const delivered = await db.transaction(async (tx) => {
      const [booking] = await tx.select().from(bookings).where(and(eligible, eq(bookings.id, id))).limit(1).for("update", { skipLocked: true })
      if (!booking) return false
      const [service] = await tx.select().from(services).where(eq(services.id, booking.serviceId)).limit(1)
      const [therapist] = booking.therapistId ? await tx.select({ code: therapists.code }).from(therapists).where(eq(therapists.id, booking.therapistId)).limit(1) : []
      const locale = booking.locale ?? "en"
      if (!(await sendBookingManagementEmail(booking, localizedServiceName(service, locale), "reminder", locale, { therapist: therapist?.code }))) return false
      await tx.update(bookings).set({ reminderEmailSentAt: new Date() }).where(eq(bookings.id, id))
      return true
    })
    if (delivered) sent++
  }
  return NextResponse.json({ sent, checked: candidates.length })
}
