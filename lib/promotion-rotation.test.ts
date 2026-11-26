import { describe, expect, it } from "vitest"

function selectPromotions<T extends { id: number; type: string; startDate: string | null; endDate: string | null }>(all: T[], now: string) {
  const seasonal = all.filter((event) => event.type === "seasonal")
  const currentSeasonal = seasonal.filter((event) => (!event.startDate || event.startDate <= now) && (!event.endDate || event.endDate >= now))
  if (currentSeasonal.length > 0) return [...currentSeasonal, ...all.filter((event) => event.type !== "seasonal" && (!event.startDate || event.startDate <= now) && (!event.endDate || event.endDate >= now))].slice(0, 3)
  const nextSeasonal = seasonal.find((event) => event.startDate && event.startDate > now)
  if (nextSeasonal) {
    const fallback = all.filter((event) => event.id !== nextSeasonal.id && event.type !== "seasonal" && (!event.startDate || event.startDate <= now) && (!event.endDate || event.endDate >= now)).slice(0, 2)
    return [nextSeasonal, ...fallback]
  }
  return all.filter((event) => (!event.startDate || event.startDate <= now) && (!event.endDate || event.endDate >= now)).slice(0, 3)
}

describe("promotion rotation", () => {
  const promotions = [
    { id: 1, type: "seasonal", startDate: "2026-01-01", endDate: "2026-09-10" },
    { id: 2, type: "seasonal", startDate: "2026-09-11", endDate: "2026-10-15" },
    { id: 3, type: "seasonal", startDate: "2026-10-16", endDate: null },
    { id: 4, type: "first_time", startDate: null, endDate: null },
  ]

  it("keeps the current promotion visible through its end date", () => {
    expect(selectPromotions(promotions, "2026-09-10").map((item) => item.id)).toEqual([1, 4])
  })

  it("shows the next scheduled promotion after expiry", () => {
    expect(selectPromotions(promotions, "2026-09-11").map((item) => item.id)).toEqual([2, 4])
  })

  it("selects the next future promotion when there is a gap", () => {
    expect(selectPromotions(promotions, "2026-09-12").map((item) => item.id)).toEqual([2, 4])
  })

  it("prioritizes the next seasonal promotion over always-on offers", () => {
    expect(selectPromotions(promotions, "2026-11-01").map((item) => item.id)).toEqual([3, 4])
  })

  it("returns at most three promotions at once", () => {
    const three = [...promotions, { id: 5, type: "seasonal", startDate: "2026-10-16", endDate: null }]
    expect(selectPromotions(three, "2026-11-01").map((item) => item.id)).toEqual([3, 5, 4])
  })
})
