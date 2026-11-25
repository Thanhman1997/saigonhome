import { beforeEach, describe, expect, it, vi } from "vitest"
import { updateBookingSettings } from "./booking-settings"
import { revalidatePath } from "next/cache"

const mocks = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn() }))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/admin-auth", () => ({ assertAdmin: vi.fn(async () => undefined) }))
vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({ values: mocks.insert }),
    update: () => ({ set: (values: unknown) => ({ where: () => mocks.update(values) }) }),
  },
}))

function makeForm(overrides: { maxGuests?: string; openTime?: string; closeTime?: string } = {}) {
  const form = new FormData()
  form.set("advanceBookingDays", "30")
  form.set("maxGuests", overrides.maxGuests ?? "10")
  form.set("openTime", overrides.openTime ?? "09:00")
  form.set("closeTime", overrides.closeTime ?? "00:00")
  form.set("groupDiscount2", "2")
  form.set("groupDiscount3", "3")
  form.set("groupDiscount4", "5")
  form.set("firstTimeDiscount", "5")
  return form
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.insert.mockResolvedValue(undefined)
  mocks.update.mockResolvedValue(undefined)
})

describe("updateBookingSettings", () => {
  it("rejects guest limits beyond the database booking constraint", async () => {
    await expect(updateBookingSettings(undefined, makeForm({ maxGuests: "11" }))).resolves.toEqual({ error: "Max guests must be between 1 and 10." })
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("rejects malformed opening and closing times", async () => {
    await expect(updateBookingSettings(undefined, makeForm({ openTime: "25:00" }))).resolves.toEqual({ error: "Invalid time format." })
    await expect(updateBookingSettings(undefined, makeForm({ closeTime: "12:60" }))).resolves.toEqual({ error: "Invalid time format." })
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("saves matching booking limits and refreshes all public booking entry points", async () => {
    await expect(updateBookingSettings(undefined, makeForm())).resolves.toEqual({ error: undefined })
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ maxGuests: 10, openTime: "09:00", closeTime: "00:00" }))
    expect(revalidatePath).toHaveBeenCalledWith("/booking")
    expect(revalidatePath).toHaveBeenCalledWith("/services")
    expect(revalidatePath).toHaveBeenCalledWith("/services/[slug]", "page")
  })
})
