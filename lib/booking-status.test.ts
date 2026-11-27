import { describe, expect, it } from "vitest"
import { allowedBookingStatuses, canTransitionBookingStatus } from "./booking-status"

describe("booking status transitions", () => {
  it.each([
    ["pending", "confirmed"],
    ["pending", "cancelled"],
    ["pending", "rejected"],
    ["confirmed", "completed"],
    ["confirmed", "cancelled"],
    ["cancelled", "confirmed"],
    ["cancelled", "pending"],
    ["confirmed", "confirmed"],
  ])("allows %s -> %s", (from, to) => expect(canTransitionBookingStatus(from, to)).toBe(true))

  it.each([
    ["pending", "completed"],
    ["confirmed", "rejected"],
    ["rejected", "confirmed"],
    ["rejected", "cancelled"],
    ["completed", "pending"],
    ["completed", "confirmed"],
    ["completed", "cancelled"],
    ["cancelled", "completed"],
  ])("rejects %s -> %s", (from, to) => expect(canTransitionBookingStatus(from, to)).toBe(false))

  it("rejects unknown statuses", () => {
    expect(canTransitionBookingStatus("pending", "paid")).toBe(false)
    expect(canTransitionBookingStatus("refunded", "pending")).toBe(false)
    expect(allowedBookingStatuses("refunded")).toEqual([])
  })

  it("lists the current status first so the select can render it", () => {
    expect(allowedBookingStatuses("completed")).toEqual(["completed"])
    expect(allowedBookingStatuses("pending")).toEqual(["pending", "confirmed", "cancelled", "rejected"])
    expect(allowedBookingStatuses("rejected")).toEqual(["rejected"])
  })
})
