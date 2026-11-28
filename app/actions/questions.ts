"use server"

import { createHmac } from "node:crypto"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { after } from "next/server"
import { clientIpFromHeaders } from "@/lib/client-ip"
import { and, eq, lt, sql } from "drizzle-orm"
import { sendTransactionalEmail } from "@/lib/transactional-email"
import { db } from "@/lib/db"
import { contactSubmissionRateLimits, questions } from "@/lib/db/schema"
import { enqueueQuestionKakaoNotification } from "@/lib/kakao-notifications"
import { sendAdminPushNotification } from "@/lib/admin-web-push"
import { assertAdmin } from "@/lib/admin-auth"
import { escapeHtml } from "@/lib/security"

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export type AskQuestionResult = { success: true } | { success: false; error: string }

async function isWithinContactRateLimit(): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error("Contact rate limiting is not configured")

  const ipAddress = clientIpFromHeaders(await headers())
  const ipHash = createHmac("sha256", secret).update(ipAddress).digest("hex")
  const now = new Date()
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000)
  const table = contactSubmissionRateLimits
  await db.delete(table).where(lt(table.windowStartedAt, cutoff))

  const [record] = await db
    .insert(table)
    .values({ ipHash, windowStartedAt: now, requestCount: 1 })
    .onConflictDoUpdate({
      target: table.ipHash,
      set: {
        windowStartedAt: sql`CASE WHEN ${table.windowStartedAt} < ${cutoff} THEN ${now} ELSE ${table.windowStartedAt} END`,
        requestCount: sql`CASE WHEN ${table.windowStartedAt} < ${cutoff} THEN 1 ELSE ${table.requestCount} + 1 END`,
      },
    })
    .returning({ requestCount: table.requestCount })

  return (record?.requestCount ?? 0) <= 5
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[^0-9]/g, "")
  return /^[+() .0-9-]{7,40}$/.test(phone) && digits.length >= 7 && digits.length <= 15
}

export async function askQuestion(input: {
  name: string
  phone: string
  email: string
  question: string
  submissionToken: string
  website?: string
}): Promise<AskQuestionResult> {
  try {
    const name = input.name?.trim()
    const phone = input.phone?.trim()
    const email = input.email?.trim()
    const question = input.question?.trim()
    const submissionToken = input.submissionToken?.trim()

    if (input.website?.trim()) return { success: true }
    if (!name || name.length > 120) return { success: false, error: "Please enter your name." }
    if (!isValidPhone(phone ?? "")) return { success: false, error: "Please enter a valid phone number." }
    if (!isValidEmail(email ?? "") || email.length > 254) return { success: false, error: "Please enter a valid email address." }
    if (!question) return { success: false, error: "Please enter your question." }
    if (question.length > 2000) return { success: false, error: "Question is too long." }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionToken ?? "")) {
      return { success: false, error: "Please refresh the form and try again." }
    }
    if (!(await isWithinContactRateLimit())) return { success: false, error: "Please wait before sending another question." }

    const [saved] = await db
      .insert(questions)
      .values({ name, phone, email, question, submissionToken })
      .onConflictDoNothing()
      .returning({ id: questions.id })

    if (!saved) return { success: true }

    try {
      await enqueueQuestionKakaoNotification(saved.id)
    } catch (error) {
      console.error("[v0] Failed to queue Kakao question notification:", error)
    }

    after(async () => {
      await Promise.all([
        sendAdminNewQuestionNotification({ name, phone, email, question }),
        sendAdminPushNotification().catch((error) => {
          console.error("[v0] Failed to send admin Web Push notification:", error)
        }),
      ])
    })
    return { success: true }
  } catch (error) {
    console.error("[v0] askQuestion error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

export type ReplyToQuestionResult =
  | { success: true; emailSent: boolean }
  | { success: false; error: string }

async function deliverReplyEmail(question: typeof questions.$inferSelect, reply: string): Promise<boolean> {
  const sent = await sendReplyToCustomer({
    email: question.email,
    name: question.name,
    question: question.question,
    reply,
  })
  await db
    .update(questions)
    .set({ replyEmailStatus: sent ? "sent" : "failed", replyEmailSentAt: sent ? new Date() : null })
    .where(eq(questions.id, question.id))
  return sent
}

export async function replyToQuestion(questionId: number, reply: string): Promise<ReplyToQuestionResult> {
  try {
    await assertAdmin()
  } catch {
    return { success: false, error: "Unauthorized" }
  }

  const trimmedReply = reply?.trim()
  if (!trimmedReply) return { success: false, error: "Reply cannot be empty" }
  if (trimmedReply.length > 5000) return { success: false, error: "Reply is too long" }

  const [updated] = await db
    .update(questions)
    .set({ reply: trimmedReply, status: "answered", repliedAt: new Date(), replyEmailStatus: "not_sent" })
    .where(and(eq(questions.id, questionId), eq(questions.status, "pending")))
    .returning()
  if (!updated) return { success: false, error: "Question not found or already answered" }

  const emailSent = await deliverReplyEmail(updated, trimmedReply)

  revalidatePath("/admin/questions")
  return { success: true, emailSent }
}

export async function resendQuestionReplyEmail(questionId: number): Promise<ReplyToQuestionResult> {
  try {
    await assertAdmin()
  } catch {
    return { success: false, error: "Unauthorized" }
  }

  const [existing] = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1)
  if (!existing?.reply) return { success: false, error: "No reply to send" }
  if (existing.replyEmailStatus === "sent") return { success: true, emailSent: true }

  const emailSent = await deliverReplyEmail(existing, existing.reply)
  revalidatePath("/admin/questions")
  return { success: true, emailSent }
}

async function sendAdminNewQuestionNotification(details: { name: string; phone: string; email: string; question: string }) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error("[v0] ADMIN_EMAIL is not set; skipping new question email")
    return
  }
  try {
    await sendTransactionalEmail({
      to: adminEmail,
      replyTo: details.email,
      subject: `New question from ${details.name.replace(/[\r\n]+/g, " ").slice(0, 80)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="margin-bottom: 4px;">New Question Received</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 6px 0; color: #666;">Name</td><td style="padding: 6px 0;">${escapeHtml(details.name)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Phone</td><td style="padding: 6px 0;">${escapeHtml(details.phone)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0;">${escapeHtml(details.email)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666; vertical-align: top;">Question</td><td style="padding: 6px 0; white-space: pre-wrap;">${escapeHtml(details.question)}</td></tr>
          </table>
          <p style="color: #666; margin-top: 16px;">Reply from the admin panel to answer this customer directly by email.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error("[v0] Failed to send admin question notification email:", error)
  }
}

async function sendReplyToCustomer(details: { email: string; name: string; question: string; reply: string }): Promise<boolean> {
  try {
    await sendTransactionalEmail({
      to: details.email,
      subject: "We answered your question — Lotus Wellness",
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="margin-bottom: 4px;">Hi ${escapeHtml(details.name)},</h2>
          <p style="color: #666;">Thank you for reaching out to Lotus Wellness. Here is our reply to your question:</p>
          <blockquote style="margin: 0 0 16px; padding: 10px 14px; background: #f6f6f6; border-left: 3px solid #ccc; color: #444;">${escapeHtml(details.question)}</blockquote>
          <p style="white-space: pre-wrap;">${escapeHtml(details.reply)}</p>
          <p style="color: #666; margin-top: 24px;">If you have any further questions, feel free to reach out again.</p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error("[v0] Failed to send reply email to customer:", error)
    return false
  }
}
