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
  replyTo,
}: {
  to: string
  subject: string
  html: string
  replyTo?: string | null
}) {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const reply_to = validEmail(replyTo) ?? validEmail(process.env.ADMIN_EMAIL)
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Lotus Wellness <booking@lotuswellness.app>",
        to: [to],
        subject,
        html,
        ...(reply_to ? { reply_to } : {}),
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
