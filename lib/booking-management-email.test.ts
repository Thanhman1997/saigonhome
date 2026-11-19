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
