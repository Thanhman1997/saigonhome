import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
  close: vi.fn(),
}))

vi.mock("nodemailer", () => ({ default: { createTransport: mocks.createTransport } }))

import { sendTransactionalEmail } from "./transactional-email"

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

  it("does not report success when SMTP rejects the recipient", async () => {
    mocks.sendMail.mockResolvedValue({ accepted: [], rejected: ["admin@example.test"] })
    const result = await sendTransactionalEmail({
      to: "admin@example.test",
      subject: "New booking",
      html: "<p>Review this booking.</p>",
      amp: "<html amp4email></html>",
    })

    expect(result).toBe(false)
  })
})
