import "server-only"
import { and, asc, count, desc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { bookings, kakaoConnections, kakaoNotifications, questions, services } from "@/lib/db/schema"
import {
  createBookingNotificationText,
  createCustomerNotificationText,
  createTestNotificationText,
  KakaoDeliveryError,
  sendKakaoMemo,
} from "@/lib/kakao"

const MAX_ATTEMPTS = 5
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 12 * 60 * 60_000]

export type KakaoDeliveryResult = {
  status: "sent" | "blocked" | "failed" | "unknown" | "already-processed"
  error?: string
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof KakaoDeliveryError) return error.message.slice(0, 300)
  return "Kakao notification could not be prepared."
}

async function processKakaoNotification(notificationId: number): Promise<KakaoDeliveryResult> {
  const [connection] = await db
    .select({ status: kakaoConnections.status })
    .from(kakaoConnections)
    .where(eq(kakaoConnections.id, 1))
    .limit(1)

  if (!connection || connection.status !== "connected") {
    await db
      .update(kakaoNotifications)
      .set({ status: "blocked", nextAttemptAt: null, updatedAt: new Date(), lastError: "Kakao is not connected." })
      .where(and(eq(kakaoNotifications.id, notificationId), inArray(kakaoNotifications.status, ["pending", "failed"])))
    return { status: "blocked" }
  }

  const now = new Date()
  const [claimed] = await db
    .update(kakaoNotifications)
    .set({
      status: "sending",
      attemptCount: sql`${kakaoNotifications.attemptCount} + 1`,
      lastAttemptAt: now,
      nextAttemptAt: null,
      updatedAt: now,
      lastError: null,
    })
    .where(and(
      eq(kakaoNotifications.id, notificationId),
      inArray(kakaoNotifications.status, ["pending", "failed"]),
      sql`${kakaoNotifications.attemptCount} < ${MAX_ATTEMPTS}`,
      or(isNull(kakaoNotifications.nextAttemptAt), lte(kakaoNotifications.nextAttemptAt, now)),
    ))
    .returning()

  if (!claimed) return { status: "already-processed" }

  try {
    let text: string
    if (claimed.notificationType === "test") {
      text = createTestNotificationText(now)
    } else if (claimed.notificationType === "question") {
      if (!claimed.questionId) throw new Error("Customer question is missing")
      const [question] = await db
        .select({
          name: questions.name,
          phone: questions.phone,
          email: questions.email,
          question: questions.question,
          createdAt: questions.createdAt,
        })
        .from(questions)
        .where(eq(questions.id, claimed.questionId))
        .limit(1)
      if (!question) throw new Error("Customer question is no longer available")

      text = createCustomerNotificationText({
        name: question.name,
        phone: question.phone ?? "Not provided",
        email: question.email,
        question: question.question,
        receivedAt: question.createdAt,
      })
    } else if (claimed.notificationType === "booking") {
      if (!claimed.bookingId) throw new Error("Customer booking is missing")
      const [booking] = await db
        .select({
          reference: bookings.reference,
          customerName: bookings.customerName,
          phone: bookings.phone,
          serviceName: services.nameEn,
          durationMinutes: bookings.durationMinutes,
          date: bookings.date,
          time: bookings.time,
          guests: bookings.guests,
        })
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(eq(bookings.id, claimed.bookingId))
        .limit(1)
      if (!booking) throw new Error("Customer booking is no longer available")

      text = createBookingNotificationText(booking)
    } else {
      throw new Error("Unsupported Kakao notification type")
    }

    await sendKakaoMemo(text)
    await db
      .update(kakaoNotifications)
      .set({ status: "sent", sentAt: new Date(), updatedAt: new Date(), lastError: null })
      .where(eq(kakaoNotifications.id, notificationId))
    return { status: "sent" }
  } catch (error) {
    const safeToRetry = !(error instanceof KakaoDeliveryError) || error.safeToRetry
    const attemptCount = claimed.attemptCount
    const canRetry = safeToRetry && attemptCount < MAX_ATTEMPTS
    const status = canRetry ? "failed" : error instanceof KakaoDeliveryError && !error.safeToRetry ? "unknown" : "failed"
    const nextAttemptAt = canRetry ? new Date(Date.now() + RETRY_DELAYS_MS[Math.min(attemptCount - 1, RETRY_DELAYS_MS.length - 1)]) : null
    const errorMessage = safeErrorMessage(error)

    await db
      .update(kakaoNotifications)
      .set({ status, nextAttemptAt, lastError: errorMessage, updatedAt: new Date() })
      .where(eq(kakaoNotifications.id, notificationId))

    return { status, error: errorMessage }
  }
}

export async function enqueueQuestionKakaoNotification(questionId: number): Promise<void> {
  const [notification] = await db
    .insert(kakaoNotifications)
    .values({ questionId, notificationType: "question", status: "pending" })
    .onConflictDoNothing()
    .returning({ id: kakaoNotifications.id })

  if (notification) await processKakaoNotification(notification.id)
}

export async function enqueueBookingKakaoNotification(bookingId: number): Promise<void> {
  const [notification] = await db
    .insert(kakaoNotifications)
    .values({ bookingId, notificationType: "booking", status: "pending" })
    .onConflictDoNothing()
    .returning({ id: kakaoNotifications.id })

  if (notification) await processKakaoNotification(notification.id)
}

export async function sendKakaoTestNotification(): Promise<KakaoDeliveryResult> {
  const [notification] = await db
    .insert(kakaoNotifications)
    .values({ notificationType: "test", status: "pending" })
    .returning({ id: kakaoNotifications.id })
  return processKakaoNotification(notification.id)
}

const KAKAO_CRON_BATCH_SIZE = 50
const KAKAO_CRON_CONCURRENCY = 5

export async function processDueKakaoNotifications(): Promise<{ attempted: number; sent: number; failed: number }> {
  const now = new Date()
  const staleSendingCutoff = new Date(now.getTime() - 10 * 60 * 1000)
  await db
    .update(kakaoNotifications)
    .set({ status: "unknown", nextAttemptAt: null, lastError: "Delivery was interrupted; verify My Chatroom before retrying.", updatedAt: now })
    .where(and(eq(kakaoNotifications.status, "sending"), lte(kakaoNotifications.lastAttemptAt, staleSendingCutoff)))

  const due = await db
    .select({ id: kakaoNotifications.id })
    .from(kakaoNotifications)
    .where(and(
      inArray(kakaoNotifications.status, ["pending", "failed"]),
      sql`${kakaoNotifications.attemptCount} < ${MAX_ATTEMPTS}`,
      or(isNull(kakaoNotifications.nextAttemptAt), lte(kakaoNotifications.nextAttemptAt, now)),
    ))
    .orderBy(asc(kakaoNotifications.createdAt))
    .limit(KAKAO_CRON_BATCH_SIZE)

  // Vercel Hobby crons run at most once a day, so one run must drain a busy day; chunks keep Kakao API concurrency low.
  const results: KakaoDeliveryResult[] = []
  for (let index = 0; index < due.length; index += KAKAO_CRON_CONCURRENCY) {
    const chunk = due.slice(index, index + KAKAO_CRON_CONCURRENCY)
    results.push(...(await Promise.all(chunk.map((notification) => processKakaoNotification(notification.id)))))
  }
  return {
    attempted: due.length,
    sent: results.filter((result) => result.status === "sent").length,
    failed: results.filter((result) => result.status === "failed" || result.status === "unknown").length,
  }
}

export async function retryFailedKakaoNotifications(): Promise<number> {
  const [connection] = await db
    .select({ status: kakaoConnections.status })
    .from(kakaoConnections)
    .where(eq(kakaoConnections.id, 1))
    .limit(1)
  if (!connection || connection.status !== "connected") return 0

  const retried = await db
    .update(kakaoNotifications)
    .set({ status: "pending", attemptCount: 0, nextAttemptAt: null, lastError: null, updatedAt: new Date() })
    .where(eq(kakaoNotifications.status, "failed"))
    .returning({ id: kakaoNotifications.id })
  return retried.length
}

export async function requeueBlockedKakaoNotifications(): Promise<void> {
  await db
    .update(kakaoNotifications)
    .set({ status: "pending", attemptCount: 0, nextAttemptAt: null, lastError: null, updatedAt: new Date() })
    .where(eq(kakaoNotifications.status, "blocked"))
}

export async function disconnectKakaoAccount(): Promise<void> {
  await db.transaction(async (transaction) => {
    await transaction.delete(kakaoConnections).where(eq(kakaoConnections.id, 1))
    await transaction
      .update(kakaoNotifications)
      .set({ status: "blocked", nextAttemptAt: null, updatedAt: new Date(), lastError: "Kakao is disconnected." })
      .where(inArray(kakaoNotifications.status, ["pending", "failed"]))
  })
}

export async function getKakaoSettingsSnapshot() {
  const [connection] = await db
    .select({
      scopes: kakaoConnections.scopes,
      status: kakaoConnections.status,
      verifiedAt: kakaoConnections.verifiedAt,
    })
    .from(kakaoConnections)
    .where(eq(kakaoConnections.id, 1))
    .limit(1)

  const [lastNotification] = await db
    .select({
      status: kakaoNotifications.status,
      notificationType: kakaoNotifications.notificationType,
      attemptCount: kakaoNotifications.attemptCount,
      sentAt: kakaoNotifications.sentAt,
      lastAttemptAt: kakaoNotifications.lastAttemptAt,
      createdAt: kakaoNotifications.createdAt,
      lastError: kakaoNotifications.lastError,
    })
    .from(kakaoNotifications)
    .orderBy(desc(kakaoNotifications.createdAt))
    .limit(1)

  const [failedCount] = await db
    .select({ value: count() })
    .from(kakaoNotifications)
    .where(eq(kakaoNotifications.status, "failed"))

  return {
    connection: connection ?? null,
    lastNotification: lastNotification ?? null,
    failedCount: failedCount?.value ?? 0,
  }
}
