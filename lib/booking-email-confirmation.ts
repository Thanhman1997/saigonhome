import { and, eq, gt } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { bookings, services, therapists } from "@/lib/db/schema"
import { bookingHasAvailableCapacity, lockBookingSchedule } from "@/lib/booking-availability"
import { issueBookingToken } from "@/lib/booking-management-token"
import { localizedServiceName } from "@/lib/booking-management-locale"
import { sendBookingManagementEmail } from "@/lib/booking-management-email"
import { hashBookingConfirmationToken } from "@/lib/booking-confirmation-token"

type ConfirmationFailure = "invalid" | "unavailable" | "error"
export type BookingEmailConfirmationResult =
  | { ok: true; customerNotificationSent: boolean }
  | { ok: false; reason: ConfirmationFailure }

type TransactionOutcome =
  | { kind: "confirmed"; booking: typeof bookings.$inferSelect; accessToken: string }
  | { kind: "invalid" | "unavailable" }

function isOverlapConstraint(error: unknown) {
  if (typeof error !== "object" || error === null) return false
  const candidate = error as { code?: unknown; constraint?: unknown }
  return candidate.code === "23P01" && candidate.constraint === "bookings_therapist_no_overlap"
}

export async function confirmBookingFromEmailToken(id: number, token: unknown, now = new Date()): Promise<BookingEmailConfirmationResult> {
  const tokenHash = hashBookingConfirmationToken(token)
  if (!tokenHash || !Number.isSafeInteger(id) || id < 1 || id > 2147483647) return { ok: false, reason: "invalid" }

  let outcome: TransactionOutcome
  try {
    outcome = await db.transaction(async (tx) => {
      await lockBookingSchedule(tx)
      const [current] = await tx.select().from(bookings).where(and(
        eq(bookings.id, id),
        eq(bookings.confirmationTokenHash, tokenHash),
      )).limit(1).for("update")

      if (!current || !current.confirmationTokenExpiresAt || current.confirmationTokenExpiresAt <= now) return { kind: "invalid" }
      if (current.status !== "pending") return { kind: "invalid" }
      if (!(await bookingHasAvailableCapacity(tx, current, current.startAt, current.endAt))) return { kind: "unavailable" }

      const access = issueBookingToken()
      const activity = [...current.activity, { kind: "confirmed", at: now.toISOString(), date: current.date, time: current.time }]
      const [updated] = await tx.update(bookings).set({
        status: "confirmed",
        confirmedAt: now,
        confirmationTokenHash: null,
        confirmationTokenExpiresAt: null,
        accessTokenHash: access.hash,
        accessTokenExpiresAt: access.expires,
        accessTokenRevokedAt: null,
        activity,
        updatedAt: now,
      }).where(and(
        eq(bookings.id, id),
        eq(bookings.status, "pending"),
        eq(bookings.confirmationTokenHash, tokenHash),
        gt(bookings.confirmationTokenExpiresAt, now),
      )).returning()

      return updated ? { kind: "confirmed", booking: updated, accessToken: access.token } : { kind: "invalid" }
    })
  } catch (error) {
    if (isOverlapConstraint(error)) return { ok: false, reason: "unavailable" }
    console.error("Email booking confirmation transaction failed", { bookingId: id, error: error instanceof Error ? error.message : "unknown" })
    return { ok: false, reason: "error" }
  }

  if (outcome.kind !== "confirmed") return { ok: false, reason: outcome.kind }

  let customerNotificationSent = false
  try {
    const [service] = await db.select().from(services).where(eq(services.id, outcome.booking.serviceId)).limit(1)
    const [therapist] = outcome.booking.therapistId
      ? await db.select({ code: therapists.code }).from(therapists).where(eq(therapists.id, outcome.booking.therapistId)).limit(1)
      : []
    const locale = outcome.booking.locale ?? "en"
    customerNotificationSent = await sendBookingManagementEmail(
      outcome.booking,
      localizedServiceName(service, locale),
      "confirmed",
      locale,
      { token: outcome.accessToken, therapist: therapist?.code },
    )
  } catch (error) {
    console.error("Customer confirmation email could not be sent", { bookingId: id, error: error instanceof Error ? error.message : "unknown" })
  }

  revalidatePath("/admin/bookings")
  return { ok: true, customerNotificationSent }
}
