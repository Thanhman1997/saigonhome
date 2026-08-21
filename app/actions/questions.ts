"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { eq } from "drizzle-orm"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { questions } from "@/lib/db/schema"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"
import { escapeHtml } from "@/lib/security"

async function assertAdmin() {
  const expected = await getExpectedAdminSessionToken()
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!expected || token !== expected) throw new Error("Unauthorized")
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export type AskQuestionResult = { success: true } | { success: false; error: string }

export async function askQuestion(input: {
  name: string
  email: string
  question: string
}): Promise<AskQuestionResult> {
  try {
    const name = input.name?.trim()
    const email = input.email?.trim()
    const question = input.question?.trim()

    if (!name) return { success: false, error: "Name is required" }
    if (!isValidEmail(email ?? "")) return { success: false, error: "Please enter a valid email address" }
    if (!question) return { success: false, error: "Please enter your question" }
    if (question.length > 2000) return { success: false, error: "Question is too long" }

    await db.insert(questions).values({ name, email, question })

    await sendAdminNewQuestionNotification({ name, email, question })

    return { success: true }
  } catch (error) {
    console.error("[v0] askQuestion error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

export type ReplyToQuestionResult = { success: true } | { success: false; error: string }

export async function replyToQuestion(questionId: number, reply: string): Promise<ReplyToQuestionResult> {
  try {
    await assertAdmin()
  } catch {
    return { success: false, error: "Unauthorized" }
  }

  const trimmedReply = reply?.trim()
  if (!trimmedReply) return { success: false, error: "Reply cannot be empty" }

  const [existing] = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1)
  if (!existing) return { success: false, error: "Question not found" }

  await db
    .update(questions)
    .set({ reply: trimmedReply, status: "answered", repliedAt: new Date() })
    .where(eq(questions.id, questionId))

  await sendReplyToCustomer({
    email: existing.email,
    name: existing.name,
    question: existing.question,
    reply: trimmedReply,
  })

  revalidatePath("/admin/questions")
  return { success: true }
}

async function sendAdminNewQuestionNotification(details: { name: string; email: string; question: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[v0] RESEND_API_KEY not set, skipping admin question notification")
    return
  }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: "Lotus Wellness <onboarding@resend.dev>",
      to: "saigonservice2020@gmail.com",
      subject: `New question from ${escapeHtml(details.name)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="margin-bottom: 4px;">New Question Received</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 6px 0; color: #666;">Name</td><td style="padding: 6px 0;">${escapeHtml(details.name)}</td></tr>
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

async function sendReplyToCustomer(details: { email: string; name: string; question: string; reply: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[v0] RESEND_API_KEY not set, skipping customer reply email")
    return
  }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: "Lotus Wellness <onboarding@resend.dev>",
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
  } catch (error) {
    console.error("[v0] Failed to send reply email to customer:", error)
  }
}
