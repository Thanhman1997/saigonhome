import nodemailer from "nodemailer"
import { afterEach, describe, expect, it, vi } from "vitest"
import { buildAdminBookingAmpConfirmationEmail, type AdminBookingConfirmationDetails } from "./booking-confirmation-email"

afterEach(() => vi.unstubAllEnvs())

const bookingDetails = (overrides: Partial<AdminBookingConfirmationDetails> = {}): AdminBookingConfirmationDetails => ({
  id: 42,
  reference: "48271",
  serviceName: "Massage",
  durationMinutes: 60,
  date: "2026-12-12",
  time: "10:00",
  guests: 1,
  customerName: "A Guest",
  email: "guest@example.test",
  phone: "0900000000",
  therapistCode: "T01",
  paymentMethod: "Cash",
  address: "District 1",
  detailedAddress: "Room 2",
  notes: "Please call on arrival",
  subtotalVnd: 500000,
  discountVnd: 0,
  discountLabel: null,
  totalVnd: 500000,
  ...overrides,
})

describe("admin booking AMP email", () => {
  it("includes both one-time POST decisions and the full booking summary", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app")
    const email = buildAdminBookingAmpConfirmationEmail(bookingDetails(), "abc_123-token")

    expect(email).toContain("<html amp4email")
    expect(email.match(/method=\"post\"/g)).toHaveLength(2)
    expect(email.match(/action-xhr=\"https:\/\/lotuswellness\.app\/api\/booking-confirmations\/confirm\"/g)).toHaveLength(2)
    expect(email.match(/name=\"token\" value=\"abc_123-token\"/g)).toHaveLength(2)
    expect(email).toContain('name="action" value="confirm"')
    expect(email).toContain('name="action" value="reject"')
    expect(email).toContain("CONFIRM BOOKING")
    expect(email).toContain("REJECT BOOKING")
    for (const detail of ["A Guest", "guest@example.test", "0900000000", "Massage (60 minutes)", "2026-12-12 at 10:00 Vietnam time", "T01", "Room 2", "Please call on arrival", "500.000 VND"]) {
      expect(email).toContain(detail)
    }
  })

  it("uses the Preview API host for preview AMP mail", () => {
    vi.stubEnv("VERCEL_ENV", "preview")
    vi.stubEnv("VERCEL_URL", "saigon-home-preview.vercel.app")
    vi.stubEnv("PREVIEW_SITE_URL", "https://preview.lotuswellness.app")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app")

    const email = buildAdminBookingAmpConfirmationEmail(bookingDetails(), "a".repeat(43))
    expect(email).toContain("action-xhr=\"https://preview.lotuswellness.app/api/booking-confirmations/confirm\"")
    expect(email).not.toContain(".vercel.app")
  })

  it("escapes customer-controlled booking details before embedding AMP markup", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app")
    const email = buildAdminBookingAmpConfirmationEmail(bookingDetails({
      reference: "<48271>",
      serviceName: "Massage & care",
      customerName: "A <Guest>",
      notes: "A <script> tag & other text",
    }), "abc_123-token")

    expect(email).toContain("&lt;48271&gt;")
    expect(email).toContain("Massage &amp; care")
    expect(email).toContain("A &lt;Guest&gt;")
    expect(email).toContain("A &lt;script&gt; tag &amp; other text")
    expect(email).not.toContain("<Guest>")
    expect(email).not.toContain("<script> tag")
  })

  it("serializes text, HTML, and AMP as distinct MIME alternatives", async () => {
    const amp = buildAdminBookingAmpConfirmationEmail(bookingDetails(), "a".repeat(43))
    const transport = nodemailer.createTransport({ streamTransport: true, buffer: true })
    try {
      const result = await transport.sendMail({
        from: "Lotus Wellness <booking@lotuswellness.app>",
        to: "admin@example.test",
        subject: "New booking",
        text: "Plain text fallback",
        html: "<p>HTML fallback</p>",
        amp,
      })
      const mime = result.message.toString("utf8")
      expect(mime).toMatch(/Content-Type: text\/plain/i)
      expect(mime).toMatch(/Content-Type: text\/html/i)
      expect(mime).toMatch(/Content-Type: text\/x-amp-html/i)
      expect(mime).toContain("Plain text fallback")
      expect(mime).toContain("HTML fallback")
      expect(mime).toContain("CONFIRM BOOKING")
    } finally {
      transport.close()
    }
  })
})
