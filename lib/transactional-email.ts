export async function sendTransactionalEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Lotus Wellness <booking@lotuswellness.app>", to: [to], subject, html }),
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
