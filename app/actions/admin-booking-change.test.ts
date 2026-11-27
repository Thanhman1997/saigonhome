import { beforeEach, describe, expect, it, vi } from "vitest"
import { approveBookingChange, declineBookingChange, resendBookingReviewInvitation, updateBookingStatus } from "./admin"
import { sendTransactionalEmail } from "@/lib/transactional-email"
import { createReviewInvitation } from "@/lib/review-invitation"

const mocks = vi.hoisted(() => ({
  rows: [] as unknown[][],
  update: vi.fn(),
  slots: vi.fn(),
  capacity: vi.fn(),
  email: vi.fn(),
  cookie: "ok",
}))

function chain() {
  const rows = mocks.rows.shift() ?? []
  const query: Record<string, unknown> = {}
  Object.assign(query, {
    from: () => query,
    leftJoin: () => query,
    where: () => query,
    limit: () => query,
    for: async () => rows,
    then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(rows).then(resolve),
  })
  return query
}

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: mocks.cookie }) }) }))
vi.mock("@/lib/admin-auth", () => ({
  ADMIN_SESSION_COOKIE: "session",
  assertAdmin: async () => {
    if (mocks.cookie !== "ok") throw new Error("Unauthorized")
  },
}))
vi.mock("@/lib/db", () => ({
  db: {
    select: chain,
    transaction: async (callback: (tx: unknown) => unknown) => callback({ select: chain, update: () => ({ set: mocks.update }) }),
  },
}))
vi.mock("@/lib/booking-availability", () => ({ availableBookingSlots: mocks.slots, bookingHasAvailableCapacity: mocks.capacity, lockBookingSchedule: vi.fn() }))
vi.mock("@/lib/booking-management-email", () => ({ sendBookingManagementEmail: mocks.email }))
vi.mock("@/lib/transactional-email", () => ({ sendTransactionalEmail: vi.fn() }))
vi.mock("@/lib/review-invitation", () => ({ createReviewInvitation: vi.fn() }))

const at = "2026-08-15T00:00:00.000Z"
const event = (kind: string, extra = {}) => ({ kind, at, date: "2026-08-18", time: "10:00", ...extra })
const booking = (activity: ReturnType<typeof event>[], status = "confirmed") => ({
  id: 7, reference: "12345", email: "guest@example.com", serviceId: 1, therapistId: null, locale: "vi", status,
  date: "2026-08-18", time: "10:00", activity,
})
const service = { nameEn: "Massage", nameVi: "Massage VI", nameKo: "마사지" }

beforeEach(() => {
  vi.resetAllMocks()
  mocks.rows = []
  mocks.cookie = "ok"
  mocks.capacity.mockResolvedValue(true)
  mocks.update.mockImplementation((patch) => ({ where: () => ({ returning: async () => [{ ...booking([]), ...patch }] }) }))
  mocks.capacity.mockResolvedValue(true)
  mocks.email.mockResolvedValue(true)
})

describe("admin review invitations", () => {
  it("reports a failed email without undoing completion", async () => {
    mocks.rows = [[{ booking: booking([]) }]]
    vi.mocked(createReviewInvitation).mockReturnValue("signed-invitation")
    vi.mocked(sendTransactionalEmail).mockResolvedValue(false)
    expect(await updateBookingStatus(7, "completed")).toEqual({ reviewEmailSent: false })
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: "completed" }))
    expect(sendTransactionalEmail).toHaveBeenCalledOnce()
  })

  it("resends a localized invitation without modifying the booking", async () => {
    mocks.rows = [[booking([], "completed")]]
    vi.mocked(createReviewInvitation).mockReturnValue("signed-invitation")
    vi.mocked(sendTransactionalEmail).mockResolvedValue(true)
    expect(await resendBookingReviewInvitation(7)).toBe(true)
    expect(sendTransactionalEmail).toHaveBeenCalledExactlyOnceWith({
      to: "guest@example.com",
      subject: "Trải nghiệm của bạn thế nào? — 12345",
      html: expect.stringContaining("/reviews?invite=signed-invitation#write-review"),
    })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it("does not send for an ineligible booking or an unauthenticated caller", async () => {
    expect(await resendBookingReviewInvitation(7)).toBe(false)
    mocks.cookie = "forged"
    await expect(resendBookingReviewInvitation(7)).rejects.toThrow("Unauthorized")
    expect(sendTransactionalEmail).not.toHaveBeenCalled()
  })
})

describe("admin confirmation of guest change requests", () => {
  it("applies a requested time only after the admin confirms, then emails the guest", async () => {
    mocks.rows = [[booking([event("created"), event("reschedule_requested", { requestedDate: "2026-08-19", requestedTime: "11:00" })])], [service]]
    mocks.slots.mockResolvedValue([{ time: "11:00", start: new Date("2026-08-19T04:00:00Z"), end: new Date("2026-08-19T05:00:00Z") }])
    expect(await approveBookingChange(7)).toEqual({ emailed: true })
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ date: "2026-08-19", time: "11:00", reminderEmailSentAt: null }))
    expect(mocks.update.mock.calls[0][0].activity.at(-1)).toMatchObject({ kind: "rescheduled", date: "2026-08-19", time: "11:00" })
    expect(mocks.email).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 7 }), "Massage VI", "rescheduled", "vi", expect.anything())
  })

  it("does not change the booking or email the guest when the requested time is gone", async () => {
    mocks.rows = [[booking([event("reschedule_requested", { requestedDate: "2026-08-19", requestedTime: "11:00" })])]]
    mocks.slots.mockResolvedValue([])
    await expect(approveBookingChange(7)).rejects.toThrow("no longer available")
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.email).not.toHaveBeenCalled()
  })

  it("cancels the booking after confirmation and emails the guest", async () => {
    mocks.rows = [[booking([event("cancel_requested")])], [service], []]
    await approveBookingChange(7)
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: "cancelled" }))
    expect(mocks.email).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 7 }), "Massage VI", "cancelled", "vi", expect.anything())
  })

  it("refuses when there is nothing to confirm or the caller is not an admin", async () => {
    mocks.rows = [[booking([event("created")])]]
    await expect(approveBookingChange(7)).rejects.toThrow("no pending change request")
    mocks.cookie = "forged"
    await expect(approveBookingChange(7)).rejects.toThrow("Unauthorized")
    await expect(declineBookingChange(7)).rejects.toThrow("Unauthorized")
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.email).not.toHaveBeenCalled()
  })

  it("declining keeps the booking as it is, closes the request and sends no confirmation", async () => {
    mocks.rows = [[booking([event("cancel_requested")])]]
    await declineBookingChange(7)
    expect(mocks.update.mock.calls[0][0]).not.toHaveProperty("status")
    expect(mocks.update.mock.calls[0][0].activity.at(-1)).toMatchObject({ kind: "change_declined" })
    expect(mocks.email).not.toHaveBeenCalled()
  })
})
