import { describe, expect, it } from "vitest"
import { zonedLocalDateTimeToUtc } from "./timezone"

describe("zonedLocalDateTimeToUtc", () => {
  it("converts Vietnam local time to UTC", () => {
    expect(zonedLocalDateTimeToUtc("2026-08-18", "10:00", "Asia/Ho_Chi_Minh").toISOString()).toBe("2026-08-18T03:00:00.000Z")
  })

  it("converts Korea local time to UTC", () => {
    expect(zonedLocalDateTimeToUtc("2026-08-18", "10:00", "Asia/Seoul").toISOString()).toBe("2026-08-18T01:00:00.000Z")
  })

  it("preserves duration when calculating the end instant", () => {
    const start = zonedLocalDateTimeToUtc("2026-08-18", "10:00", "Asia/Ho_Chi_Minh")
    const end = new Date(start.getTime() + 90 * 60 * 1000)
    expect(end.toISOString()).toBe("2026-08-18T04:30:00.000Z")
  })
})
