"use server"

import { and, eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { bookingNotifications } from "@/lib/db/schema"
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth"
import { sendBookingNotification, type BookingNotificationEvent } from "@/lib/booking-notifications"

async function assertAdmin() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!(await isValidAdminSession(token))) throw new Error("Unauthorized")
}

export async function retryBookingNotification(id: number) {
  await assertAdmin()
  const [notification] = await db.select().from(bookingNotifications).where(and(eq(bookingNotifications.id, id), eq(bookingNotifications.status, "failed"))).limit(1)
  if (!notification) throw new Error("Failed notification not found")
  return sendBookingNotification(notification.bookingId, notification.event as BookingNotificationEvent, notification.recipient === process.env.ADMIN_EMAIL ? "admin" : "customer")
}
