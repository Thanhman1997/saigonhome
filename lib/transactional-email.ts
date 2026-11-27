import nodemailer from "nodemailer"

export const TRANSACTIONAL_EMAIL_FROM_ADDRESS = "booking@lotuswellness.app"
const TRANSACTIONAL_EMAIL_FROM = `Lotus Wellness <${TRANSACTIONAL_EMAIL_FROM_ADDRESS}>`
const EMAIL_PATTERN = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/

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
}: {
  to: string
  subject: string
  html: string
  text?: string
  amp?: string
  replyTo?: string | null
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
      return info.accepted.length > 0 && info.rejected.length === 0
    } catch {
      console.error("Resend SMTP rejected AMP transactional email")
      return false
    } finally {
      transport.close()
    }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
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
