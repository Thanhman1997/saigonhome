import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ confirm: vi.fn(), reject: vi.fn() }))
vi.mock("@/lib/booking-email-confirmation", () => ({ confirmBookingFromEmailToken: mocks.confirm, rejectBookingFromEmailToken: mocks.reject }))

import { GET, POST } from "./route"

const sender = "booking@lotuswellness.app"
const token = "a".repeat(43)

function makePostRequest(options: { sender?: string; origin?: string; source?: string; contentType?: string; action?: string } = {}) {
  const url = new URL("https://lotuswellness.app/api/booking-confirmations/confirm")
  if (options.source) url.searchParams.set("__amp_source_origin", options.source)
  const headers = new Headers({ "Content-Type": options.contentType ?? "application/x-www-form-urlencoded" })
  if (options.sender) headers.set("AMP-Email-Sender", options.sender)
  if (options.origin) headers.set("Origin", options.origin)
  return new Request(url, { method: "POST", headers, body: new URLSearchParams({ bookingId: "42", token, ...(options.action ? { action: options.action } : {}) }) })
}

beforeEach(() => {
  mocks.confirm.mockReset()
  mocks.reject.mockReset()
})

describe("Gmail AMP booking confirmation endpoint", () => {
  it("accepts an authorized AMP POST and returns the sender allow header", async () => {
    mocks.confirm.mockResolvedValue({ ok: true, customerNotificationSent: true })
    const response = await POST(makePostRequest({ sender }))

    expect(response.status).toBe(200)
    expect(response.headers.get("AMP-Email-Allow-Sender")).toBe(sender)
    expect(mocks.confirm).toHaveBeenCalledWith(42, token)
    expect(await response.json()).toEqual({ message: "Booking confirmed. Resend accepted the customer notification." })
  })

  it("routes a reject action to the shared one-time decision handler", async () => {
    mocks.reject.mockResolvedValue({ ok: true, customerNotificationSent: true })
    const response = await POST(makePostRequest({ sender, action: "reject" }))

    expect(response.status).toBe(200)
    expect(mocks.reject).toHaveBeenCalledWith(42, token)
    expect(mocks.confirm).not.toHaveBeenCalled()
    expect(await response.json()).toEqual({ message: "Booking rejected. Resend accepted the customer notification." })
  })

  it("supports the legacy AMP CORS sender parameter only for Gmail origins", async () => {
    mocks.confirm.mockResolvedValue({ ok: true, customerNotificationSent: false })
    const response = await POST(makePostRequest({ origin: "https://mail.google.com", source: sender }))

    expect(response.status).toBe(200)
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://mail.google.com")
    expect(response.headers.get("AMP-Access-Control-Allow-Source-Origin")).toBe(sender)
  })

  it("rejects unauthorized AMP senders without calling confirmation logic", async () => {
    const response = await POST(makePostRequest({ sender: "attacker@example.test" }))
    expect(response.status).toBe(403)
    expect(mocks.confirm).not.toHaveBeenCalled()
  })

  it("keeps GET safe so link scanners cannot confirm a booking", async () => {
    const response = await GET()
    expect(response.status).toBe(405)
    expect(mocks.confirm).not.toHaveBeenCalled()
  })

  it("rejects unknown booking decisions", async () => {
    const response = await POST(makePostRequest({ sender, action: "delete" }))
    expect(response.status).toBe(400)
    expect(mocks.confirm).not.toHaveBeenCalled()
    expect(mocks.reject).not.toHaveBeenCalled()
  })

  it("rejects non-form requests", async () => {
    const response = await POST(makePostRequest({ sender, contentType: "application/json" }))
    expect(response.status).toBe(400)
    expect(mocks.confirm).not.toHaveBeenCalled()
    expect(mocks.reject).not.toHaveBeenCalled()
  })
})
