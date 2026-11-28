import nodemailer from "nodemailer"

export const TRANSACTIONAL_EMAIL_FROM_ADDRESS = "booking@lotuswellness.app"
const TRANSACTIONAL_EMAIL_FROM = `Lotus Wellness <${TRANSACTIONAL_EMAIL_FROM_ADDRESS}>`
const EMAIL_PATTERN = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/

export type AdminBookingEmailMode = "AMP" | "HTML" | "AUTO"

export type AdminBookingEmailConfig = {
  mode: AdminBookingEmailMode
  gmailSenderApproved: boolean
  ampLiveDeliveryVerified: boolean
}

export function getAdminBookingEmailConfig(environment: Record<string, string | undefined> = process.env): AdminBookingEmailConfig {
  const mode = environment.ADMIN_BOOKING_EMAIL_MODE?.toUpperCase()
  return {
    mode: mode === "AMP" || mode === "HTML" ? mode : "AUTO",
    gmailSenderApproved: environment.GMAIL_AMP_SENDER_APPROVED?.toLowerCase() === "true",
    ampLiveDeliveryVerified: environment.GMAIL_AMP_LIVE_DELIVERY_VERIFIED?.toLowerCase() === "true",
  }
}

export function selectAdminBookingEmailFormat(config = getAdminBookingEmailConfig()): "AMP" | "HTML" {
  if (config.mode === "HTML") return "HTML"
  return config.gmailSenderApproved && config.ampLiveDeliveryVerified ? "AMP" : "HTML"
}

function validEmail(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed && EMAIL_PATTERN.test(trimmed) ? trimmed : undefined
}

/**
 * `from` is always the verified domain address. Replies go to `replyTo` when given
 * (e.g. the customer, for admin notifications) and otherwise to ADMIN_EMAIL, so a
 * customer pressing "Reply" reaches the admin's real inbox.
 */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  amp,
  replyTo,
  idempotencyKey,
}: {
  to: string
  subject: string
  html: string
  text?: string
  amp?: string
  replyTo?: string | null
  idempotencyKey?: string
}) {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const replyToAddress = validEmail(replyTo) ?? validEmail(process.env.ADMIN_EMAIL)

  if (amp) {
    const transport = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: key },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    })
    try {
      const info = await transport.sendMail({
        from: TRANSACTIONAL_EMAIL_FROM,
        to,
        subject,
        text: text ?? "Please view this email in a compatible email client.",
        html,
        amp,
        ...(replyToAddress ? { replyTo: replyToAddress } : {}),
      })
      if (info.accepted.length > 0) return true
      if (info.rejected.length === 0) {
        console.error("Resend SMTP acceptance was unclear; skipped HTML fallback to avoid duplicate email")
        return false
      }
      console.error("Resend SMTP explicitly rejected AMP transactional email; falling back to HTML")
    } catch (error) {
      const responseCode = typeof error === "object" && error !== null && "responseCode" in error
        ? Number((error as { responseCode?: unknown }).responseCode)
        : Number.NaN
      if (!Number.isInteger(responseCode) || responseCode < 400 || responseCode >= 600) {
        console.error("Resend SMTP outcome was unclear; skipped HTML fallback to avoid duplicate email")
        return false
      }
      console.error("Resend SMTP explicitly rejected AMP transactional email; falling back to HTML")
    } finally {
      transport.close()
    }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: TRANSACTIONAL_EMAIL_FROM,
        to: [to],
        subject,
        html,
        ...(text ? { text } : {}),
        ...(replyToAddress ? { reply_to: replyToAddress } : {}),
      }),
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    })
    if (!response.ok) console.error("Resend rejected transactional email", response.status)
    return response.ok
  } catch {
    console.error("Transactional email could not be sent")
    return false
  }
}
