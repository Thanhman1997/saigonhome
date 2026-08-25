import { NextRequest, NextResponse } from "next/server"
import { and, eq, isNull, lt, sql } from "drizzle-orm"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { bookings, services } from "@/lib/db/schema"
import { escapeHtml } from "@/lib/security"

const REMINDER_WINDOW_HOURS = 25

export async function GET(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ sent: 0, skipped: "RESEND_API_KEY not configured" })

  const resend = new Resend(apiKey)
  const nowVietnam = sql`CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh'`
  const reminderCutoff = sql`CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh' + INTERVAL '${sql.raw(String(REMINDER_WINDOW_HOURS))} hours'`
  const candidates = await db
    .select({ booking: bookings, serviceName: services.nameEn })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.status, "confirmed"),
        isNull(bookings.reminderEmailSentAt),
        sql`${bookings.startAt} >= ${nowVietnam}`,
        lt(bookings.startAt, reminderCutoff),
      ),
    )
    .limit(100)

  let sent = 0
  for (const { booking, serviceName } of candidates) {
    await db.transaction(async (tx) => {
      const [locked] = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(eq(bookings.id, booking.id), isNull(bookings.reminderEmailSentAt)))
        .for("update", { skipLocked: true })
        .limit(1)
      if (!locked) return

      await resend.emails.send({
        from: "Lotus Wellness <onboarding@resend.dev>",
        to: booking.email,
        subject: `Reminder — your Lotus Wellness booking ${booking.reference} is tomorrow`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#24312d"><h2>Your appointment is coming up</h2><p>Dear ${escapeHtml(booking.customerName)}, this is a reminder for your Lotus Wellness appointment.</p><p><strong>${escapeHtml(serviceName ?? "Wellness treatment")}</strong><br />${escapeHtml(booking.date)} at ${escapeHtml(booking.time)} (Vietnam time)<br />Reference: <strong>${escapeHtml(booking.reference)}</strong></p><p>Please contact us if you need to change your appointment.</p></div>`,
      })

      await tx
        .update(bookings)
        .set({ reminderEmailSentAt: new Date() })
        .where(and(eq(bookings.id, booking.id), isNull(bookings.reminderEmailSentAt)))
      sent += 1
    })
  }

  return NextResponse.json({ sent, checked: candidates.length })
}
