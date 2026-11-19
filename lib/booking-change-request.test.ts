import { describe, expect, it } from "vitest"
import { pendingChangeRequest } from "./booking-change-request"

const base = { at: "2026-08-15T00:00:00.000Z", date: "2026-08-18", time: "10:00" }

describe("pendingChangeRequest", () => {
  it("is empty without requests", () => {
    expect(pendingChangeRequest(undefined)).toBeNull()
    expect(pendingChangeRequest([{ ...base, kind: "created" }, { ...base, kind: "confirmed" }])).toBeNull()
  })

  it("returns the latest open request and survives admin status changes", () => {
    const activity = [
      { ...base, kind: "created" },
      { ...base, kind: "reschedule_requested", requestedDate: "2026-08-19", requestedTime: "11:00" },
      { ...base, kind: "confirmed" },
    ]
    expect(pendingChangeRequest(activity)).toEqual({ kind: "reschedule", at: base.at, date: "2026-08-19", time: "11:00" })
    expect(pendingChangeRequest([...activity, { ...base, kind: "cancel_requested" }])).toEqual({ kind: "cancel", at: base.at })
  })

  it.each(["rescheduled", "cancelled", "change_declined"])("closes the request once it is %s", (kind) => {
    expect(pendingChangeRequest([
      { ...base, kind: "cancel_requested" },
      { ...base, kind },
    ])).toBeNull()
  })
})
