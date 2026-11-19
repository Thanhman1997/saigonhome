export async function sendTransactionalEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const key = process.env.BREVO_API_KEY
  if (!key) return false
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Lotus Wellness", email: process.env.BREVO_FROM_EMAIL ?? "booking@lotuswellness.app" },
        to: [{ email: to, contactPixelTrackingConsent: false }], subject, htmlContent: html,
      }),
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    })
    if (!response.ok) console.error("Brevo rejected transactional email", response.status)
    return response.ok
  } catch {
    console.error("Transactional email could not be sent")
    return false
  }
}
