import { NextResponse } from "next/server"
import { confirmBookingFromEmailToken, rejectBookingFromEmailToken } from "@/lib/booking-email-confirmation"
import { TRANSACTIONAL_EMAIL_FROM_ADDRESS } from "@/lib/transactional-email"

export const runtime = "nodejs"

const ADMIN_SENDER = TRANSACTIONAL_EMAIL_FROM_ADDRESS
const GMAIL_ORIGINS = new Set(["https://mail.google.com", "https://mail.googleusercontent.com"])
const NO_STORE = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }

type AmpCors = { headers: Headers; valid: boolean }

function ampCors(request: Request): AmpCors {
  const sender = request.headers.get("AMP-Email-Sender")?.trim().toLowerCase()
  if (sender) {
    if (sender !== ADMIN_SENDER) return { headers: new Headers(NO_STORE), valid: false }
    return { headers: new Headers({ ...NO_STORE, "AMP-Email-Allow-Sender": ADMIN_SENDER }), valid: true }
  }

  const origin = request.headers.get("Origin")
  const source = new URL(request.url).searchParams.get("__amp_source_origin")?.trim().toLowerCase()
  if (!origin || !GMAIL_ORIGINS.has(origin) || source !== ADMIN_SENDER) return { headers: new Headers(NO_STORE), valid: false }

  return {
    headers: new Headers({
      ...NO_STORE,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Expose-Headers": "AMP-Access-Control-Allow-Source-Origin",
      "AMP-Access-Control-Allow-Source-Origin": source,
      Vary: "Origin",
    }),
    valid: true,
  }
}

function json(body: unknown, status: number, headers: Headers) {
  headers.set("Content-Type", "application/json; charset=utf-8")
  return NextResponse.json(body, { status, headers })
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("Origin")
  if (!origin || !GMAIL_ORIGINS.has(origin)) return new Response(null, { status: 403, headers: NO_STORE })
  const headers = new Headers({
    ...NO_STORE,
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, AMP-Email-Sender",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  })
  return new Response(null, { status: 204, headers })
}

export async function GET() {
  return NextResponse.json({ message: "Use the POST confirmation button in the email." }, {
    status: 405,
    headers: { ...NO_STORE, Allow: "POST, OPTIONS" },
  })
}

export async function POST(request: Request) {
  const cors = ampCors(request)
  if (!cors.valid) return json({ message: "This confirmation request is not authorized." }, 403, cors.headers)

  const contentType = request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase()
  const contentLength = Number(request.headers.get("Content-Length") ?? 0)
  if (contentType !== "application/x-www-form-urlencoded" || contentLength > 8192) {
    return json({ message: "Invalid confirmation request." }, 400, cors.headers)
  }

  const rawBody = await request.text().catch(() => "")
  if (rawBody.length > 8192) return json({ message: "Invalid confirmation request." }, 400, cors.headers)
  const form = new URLSearchParams(rawBody)
  const idValue = form.get("bookingId")
  const token = form.get("token")
  const actionValue = form.get("action") ?? "confirm"
  const action = actionValue === "confirm" || actionValue === "reject" ? actionValue : null
  const id = typeof idValue === "string" && /^\d{1,10}$/.test(idValue) ? Number(idValue) : Number.NaN
  if (!Number.isSafeInteger(id) || typeof token !== "string" || !action) {
    return json({ message: "Invalid booking decision request." }, 400, cors.headers)
  }

  const result = action === "confirm"
    ? await confirmBookingFromEmailToken(id, token)
    : await rejectBookingFromEmailToken(id, token)
  if (!result.ok) {
    const message = result.reason === "unavailable"
      ? "This time is no longer available. The booking was not changed. Please review it in the admin dashboard."
      : result.reason === "error"
        ? "We could not process this booking decision right now. Please try again later."
        : "This link is invalid, expired, or already used. No changes were made."
    return json({ message }, result.reason === "error" ? 500 : 409, cors.headers)
  }

  const decision = action === "confirm" ? "confirmed" : "rejected"
  const message = result.customerNotificationSent
    ? `Booking ${decision}. Resend accepted the customer notification.`
    : `Booking ${decision}, but Resend did not accept the customer email. Please contact the customer.`
  return json({ message }, 200, cors.headers)
}
