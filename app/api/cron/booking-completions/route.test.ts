import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "./route"

const mocks = vi.hoisted(() => ({
  validCronSecret: vi.fn(),
  complete: vi.fn(),
  sendReview: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/cron-auth", () => ({ hasValidCronSecret: mocks.validCronSecret }))
vi.mock("@/lib/booking-completion", () => ({ completeOverdueConfirmedBookings: mocks.complete }))
vi.mock("@/lib/booking-review-invitation-email", () => ({ sendBookingReviewInvitation: mocks.sendReview }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))

beforeEach(() => {
  vi.resetAllMocks()
  mocks.validCronSecret.mockReturnValue(true)
  mocks.complete.mockResolvedValue([])
  mocks.sendReview.mockResolvedValue(true)
})

describe("booking completion cron", () => {
  it("rejects requests without the cron secret before touching bookings", async () => {
    mocks.validCronSecret.mockReturnValue(false)
    const response = await GET(new NextRequest("https://example.test/api/cron/booking-completions"))

    expect(response.status).toBe(401)
    expect(mocks.complete).not.toHaveBeenCalled()
    expect(mocks.sendReview).not.toHaveBeenCalled()
  })

  it("invites guests only for rows transitioned by the guarded backend update", async () => {
    const updated = [
      { id: 1, email: "first@example.com", reference: "LW001", locale: "en" },
      { id: 2, email: "second@example.com", reference: "LW002", locale: "vi" },
    ]
    mocks.complete.mockResolvedValue(updated)
    mocks.sendReview.mockResolvedValueOnce(true).mockResolvedValueOnce(false)

    const response = await GET(new NextRequest("https://example.test/api/cron/booking-completions", {
      headers: { authorization: "Bearer test-secret" },
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ completed: 2, reviewInvitationsAccepted: 1, checked: 2 })
    expect(mocks.sendReview).toHaveBeenCalledTimes(2)
    expect(mocks.sendReview).toHaveBeenNthCalledWith(1, updated[0])
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/dashboard")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/bookings")
  })

  it("does not invalidate routes when there are no completed bookings", async () => {
    await GET(new NextRequest("https://example.test/api/cron/booking-completions"))
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })
})
