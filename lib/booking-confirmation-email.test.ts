import { afterEach, describe, expect, it, vi } from "vitest"
import { buildAdminBookingAmpConfirmationEmail } from "./booking-confirmation-email"

afterEach(() => vi.unstubAllEnvs())

describe("admin booking AMP confirmation email", () => {
  it("submits a one-time token to the HTTPS endpoint using POST", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app")
    const email = buildAdminBookingAmpConfirmationEmail({
      id: 42,
      reference: "48271",
      serviceName: "Massage",
      date: "2026-12-12",
      time: "10:00",
      customerName: "A Guest",
    }, "abc_123-token")

    expect(email).toContain("<html amp4email")
    expect(email).toContain("method=\"post\"")
    expect(email).toContain("action-xhr=\"https://lotuswellness.app/api/booking-confirmations/confirm\"")
    expect(email).toContain("name=\"bookingId\" value=\"42\"")
    expect(email).toContain("name=\"token\" value=\"abc_123-token\"")
    expect(email).toContain("CONFIRM BOOKING")
    expect(email).not.toContain("href=\"https://lotuswellness.app/api/booking-confirmations/confirm")
  })

  it("escapes booking details before embedding them in AMP markup", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app")
    const email = buildAdminBookingAmpConfirmationEmail({
      id: 42,
      reference: "<48271>",
      serviceName: "Massage & care",
      date: "2026-12-12",
      time: "10:00",
      customerName: "A <Guest>",
    }, "abc_123-token")

    expect(email).toContain("&lt;48271&gt;")
    expect(email).toContain("Massage &amp; care")
    expect(email).toContain("A &lt;Guest&gt;")
    expect(email).not.toContain("<Guest>")
  })
})
