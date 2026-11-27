import { beforeEach, describe, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
import type { SQL } from "drizzle-orm"
import { completeOverdueConfirmedBookings } from "./booking-completion"

const mocks = vi.hoisted(() => ({
  candidates: [] as { id: number }[],
  completed: [] as { id: number; email: string; reference: string; locale: "en" | "vi" | "ko" | null }[],
  selectCondition: null as unknown,
  updateCondition: null as unknown,
  updatePatch: null as Record<string, unknown> | null,
}))

vi.mock("@/lib/db", () => ({
  db: {
    select: () => {
      const query: Record<string, unknown> = {}
      Object.assign(query, {
        from: () => query,
        where: (condition: unknown) => { mocks.selectCondition = condition; return query },
        orderBy: () => query,
        limit: async () => mocks.candidates,
      })
      return query
    },
    update: () => ({
      set: (patch: Record<string, unknown>) => {
        mocks.updatePatch = patch
        return {
          where: (condition: unknown) => {
            mocks.updateCondition = condition
            return { returning: async () => mocks.completed }
          },
        }
      },
    }),
  },
}))

beforeEach(() => {
  mocks.candidates = []
  mocks.completed = []
  mocks.selectCondition = null
  mocks.updateCondition = null
  mocks.updatePatch = null
})

describe("overdue booking completion", () => {
  it("does nothing when there are no due confirmed bookings", async () => {
    expect(await completeOverdueConfirmedBookings(new Date("2026-11-27T10:00:00.000Z"))).toEqual([])
    expect(mocks.updatePatch).toBeNull()
  })

  it("only completes due confirmed bookings once and appends a system history event", async () => {
    const now = new Date("2026-11-27T10:00:00.000Z")
    mocks.candidates = [{ id: 12 }]
    mocks.completed = [{ id: 12, email: "guest@example.com", reference: "LW123", locale: "vi" }]

    expect(await completeOverdueConfirmedBookings(now)).toEqual(mocks.completed)
    expect(mocks.updatePatch).toMatchObject({ status: "completed", updatedAt: now })

    const selection = new PgDialect().sqlToQuery(mocks.selectCondition as SQL)
    expect(selection.sql).toContain('"bookings"."status" =')
    expect(selection.sql).toContain('"bookings"."end_at" <=')
    expect(selection.params).toContain("confirmed")

    const guardedUpdate = new PgDialect().sqlToQuery(mocks.updateCondition as SQL)
    expect(guardedUpdate.sql).toContain('"bookings"."status" =')
    expect(guardedUpdate.sql).toContain('"bookings"."end_at" <=')
    expect(guardedUpdate.params).toContain("confirmed")

    const activity = new PgDialect().sqlToQuery(mocks.updatePatch?.activity as SQL)
    expect(activity.sql).toContain("jsonb_build_array")
    expect(activity.params).toContain("2026-11-27T10:00:00.000Z")
    expect(activity.sql).toContain("'actor', 'system'")
  })
})
