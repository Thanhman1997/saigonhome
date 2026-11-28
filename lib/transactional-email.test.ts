import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
  close: vi.fn(),
}))

vi.mock("nodemailer", () => ({ default: { createTransport: mocks.createTransport } }))

import { getAdminBookingEmailConfig, selectAdminBookingEmailFormat, sendTransactionalEmail } from "./transactional-email"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "test-resend-key")
  mocks.createTransport.mockReset().mockReturnValue({ sendMail: mocks.sendMail, close: mocks.close })
  mocks.sendMail.mockReset().mockResolvedValue({ accepted: ["admin@example.test"], rejected: [] })
  mocks.close.mockReset()
})

describe("transactional email delivery", () => {
  it("sends standard mail through Resend HTTP without using SMTP", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchMock)

    const result = await sendTransactionalEmail({
      to: "admin@example.test",
      subject: "New booking",
      text: "A customer submitted a booking request.",
      html: "<p>A customer submitted a booking request.</p>",
    })

    expect(result).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"to":["admin@example.test"]'),
    }))
    expect(mocks.createTransport).not.toHaveBeenCalled()
  })

  it("sends the AMP MIME alternative through Resend SMTP", async () => {
    const result = await sendTransactionalEmail({
      to: "admin@example.test",
      subject: "New booking",
      text: "Confirm this booking.",
      html: "<p>Review this booking.</p>",
      amp: "<!doctype html><html amp4email><body><form method=\"post\"></form></body></html>",
      replyTo: "guest@example.test",
    })

    expect(result).toBe(true)
    expect(mocks.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: "test-resend-key" },
    }))
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: "Lotus Wellness <booking@lotuswellness.app>",
      to: "admin@example.test",
      amp: expect.stringContaining("amp4email"),
      text: "Confirm this booking.",
      replyTo: "guest@example.test",
    }))
    expect(mocks.close).toHaveBeenCalledOnce()
  })

  it("falls back through Resend API only after an explicit SMTP rejection", async () => {
    mocks.sendMail.mockResolvedValue({ accepted: [], rejected: ["admin@example.test"] })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchMock)

    const result = await sendTransactionalEmail({
      to: "admin@example.test",
      subject: "New booking",
      text: "Plain fallback",
      html: "<p>HTML fallback</p>",
      amp: "<html amp4email></html>",
      idempotencyKey: "booking-42",
    })

    expect(result).toBe(true)
    expect(mocks.sendMail).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "Idempotency-Key": "booking-42" }),
      body: expect.stringContaining('"html":"<p>HTML fallback</p>"'),
    }))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty("amp")
  })

  it("falls back when the SMTP server explicitly rejects the AMP message before acceptance", async () => {
    mocks.sendMail.mockRejectedValue(Object.assign(new Error("SMTP 550 rejected"), { responseCode: 550 }))
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchMock)

    expect(await sendTransactionalEmail({
      to: "admin@example.test",
      subject: "New booking",
      html: "<p>HTML fallback</p>",
      amp: "<html amp4email></html>",
    })).toBe(true)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it("does not send a second email when the SMTP result is ambiguous", async () => {
    mocks.sendMail.mockRejectedValue(new Error("socket timeout after DATA"))
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const result = await sendTransactionalEmail({
      to: "admin@example.test",
      subject: "New booking",
      html: "<p>HTML fallback</p>",
      amp: "<html amp4email></html>",
    })

    expect(result).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("does not send a second email when SMTP returns no recipient disposition", async () => {
    mocks.sendMail.mockResolvedValue({ accepted: [], rejected: [] })
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    expect(await sendTransactionalEmail({ to: "admin@example.test", subject: "New booking", html: "<p>Fallback</p>", amp: "<html amp4email></html>" })).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("requires both Google approval and successful Gmail testing, not AMP_ENABLED alone", () => {
    const ampEnabledOnly = getAdminBookingEmailConfig({ ADMIN_BOOKING_EMAIL_MODE: "AMP", AMP_ENABLED: "true" })
    expect(selectAdminBookingEmailFormat(ampEnabledOnly)).toBe("HTML")
    expect(selectAdminBookingEmailFormat({ mode: "AUTO", gmailSenderApproved: true, ampLiveDeliveryVerified: false })).toBe("HTML")
    expect(selectAdminBookingEmailFormat({ mode: "AUTO", gmailSenderApproved: true, ampLiveDeliveryVerified: true })).toBe("AMP")
    expect(selectAdminBookingEmailFormat({ mode: "HTML", gmailSenderApproved: true, ampLiveDeliveryVerified: true })).toBe("HTML")
  })
})
