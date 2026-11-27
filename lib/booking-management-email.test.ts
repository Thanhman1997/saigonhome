import { afterEach, describe, expect, it, vi } from "vitest"
import { sendBookingManagementEmail } from "./booking-management-email"
import { issueBookingToken } from "./booking-management-token"

const booking = { reference: "48271", email: "guest@example.test", date: "2026-12-12", time: "10:00", status: "pending" }

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe("Resend booking emails", () => {
  it.each([
    ["en", "Booking request received", "Manage my booking", "Pending confirmation", "Massage"],
    ["vi", "Đã nhận yêu cầu đặt lịch", "Quản lý lịch hẹn của tôi", "Chờ xác nhận", "Mát-xa"],
    ["ko", "예약 요청이 접수되었습니다", "내 예약 관리", "확인 대기 중", "마사지"],
  ] as const)("uses %s in the subject, date, status, and private link", async (locale, title, manage, status, service) => {
    vi.stubEnv("RESEND_API_KEY", "test-key")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.test")
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal("fetch", fetch)
    const { token } = issueBookingToken()
    expect(await sendBookingManagementEmail(booking, service, "received", locale, { token, therapist: "T01" })).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, request] = fetch.mock.calls[0]
    expect(url).toBe("https://api.resend.com/emails")
    expect(new Headers(request?.headers).get("authorization")).toBe("Bearer test-key")
    const payload = JSON.parse(String(request?.body))
    expect(payload).toMatchObject({ from: "Lotus Wellness <booking@lotuswellness.app>", to: [booking.email], subject: `${title} — ${booking.reference}` })
    for (const text of [manage, status, service, "T01", `lang=${locale}#access=${token}`, `lang=\"${locale}\"`]) expect(payload.html).toContain(text)
    expect(payload.html).not.toContain("2026-12-12")
  })

  it.each([
    ["en", "We only accept payment by cash or bank transfer."],
    ["vi", "Chúng tôi chỉ chấp nhận thanh toán bằng tiền mặt hoặc chuyển khoản."],
    ["ko", "결제는 현금 또는 계좌이체만 가능합니다."],
  ] as const)("replaces payment links in %s confirmations and keeps the management button", async (locale, notice) => {
    vi.stubEnv("RESEND_API_KEY", "test-key")
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal("fetch", fetch)
    const { token } = issueBookingToken()
    await sendBookingManagementEmail({ ...booking, status: "confirmed" }, null, "confirmed", locale, {
      token,
      template: "Custom subject\nCustom greeting\n\nPayment options:\n1. Pay directly at the spa or by bank transfer.\n2. Pay by Visa or Mastercard: {{paymentUrl}}",
    })
    const { html } = JSON.parse(String(fetch.mock.calls[0][1]?.body))
    expect(html).toContain(notice)
    expect(html).toContain("Custom greeting")
    expect(html).toContain(`/booking/manage?lang=${locale}#access=${token}`)
    expect(html).not.toMatch(/Payment options|Visa|Mastercard|paymentUrl|\/payment\/result/)
  })

  it("routes replies to the admin by default and to the customer when asked", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key")
    vi.stubEnv("ADMIN_EMAIL", "admin@example.test")
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal("fetch", fetch)
    const { sendTransactionalEmail } = await import("./transactional-email")
    await sendTransactionalEmail({ to: "guest@example.test", subject: "Hi", html: "<p>Hi</p>" })
    await sendTransactionalEmail({ to: "admin@example.test", subject: "Hi", html: "<p>Hi</p>", replyTo: "guest@example.test" })
    await sendTransactionalEmail({ to: "admin@example.test", subject: "Hi", html: "<p>Hi</p>", replyTo: "not an email" })
    const bodies = fetch.mock.calls.map(([, request]) => JSON.parse(String(request?.body)))
    expect(bodies[0].reply_to).toBe("admin@example.test")
    expect(bodies[1].reply_to).toBe("guest@example.test")
    expect(bodies[2].reply_to).toBe("admin@example.test")
    expect(bodies[0].from).toBe("Lotus Wellness <booking@lotuswellness.app>")
  })

  it("does not claim delivery when Resend is unconfigured or rejects a send", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(null, { status: 401 }))
    vi.stubGlobal("fetch", fetch)
    expect(await sendBookingManagementEmail(booking, null, "cancelled", "vi")).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
    vi.stubEnv("RESEND_API_KEY", "test-key")
    expect(await sendBookingManagementEmail(booking, null, "cancelled", "vi")).toBe(false)
  })
})
