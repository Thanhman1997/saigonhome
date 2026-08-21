import { describe, expect, it, vi } from "vitest"
import {
  escapeHtml,
  isRateLimited,
  makeExpiringSessionToken,
  splitExpiringSessionToken,
} from "./security"

describe("security helpers", () => {
  it("escapes user-controlled email content", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    )
  })

  it("rate limits attempts after the configured limit", () => {
    vi.useFakeTimers()
    const key = `test-${Date.now()}`
    expect(isRateLimited(key, 2, 1000)).toBe(false)
    expect(isRateLimited(key, 2, 1000)).toBe(false)
    expect(isRateLimited(key, 2, 1000)).toBe(true)
    vi.advanceTimersByTime(1001)
    expect(isRateLimited(key, 2, 1000)).toBe(false)
    vi.useRealTimers()
  })

  it("creates and parses expiring session tokens", () => {
    const token = makeExpiringSessionToken("expected-token")
    expect(splitExpiringSessionToken(token)).toEqual({
      issuedAt: expect.any(Number),
      token: "expected-token",
    })
    expect(splitExpiringSessionToken("invalid")).toBeNull()
  })

  it("identifies expired session timestamps", () => {
    vi.useFakeTimers()
    const issuedAt = Date.now()
    vi.advanceTimersByTime(8 * 60 * 60 * 1000 + 1)
    const parsed = splitExpiringSessionToken(`${issuedAt}.expected-token`)
    expect(parsed?.issuedAt).toBe(issuedAt)
    expect(Date.now() - (parsed?.issuedAt ?? Date.now())).toBeGreaterThan(8 * 60 * 60 * 1000)
    vi.useRealTimers()
  })
})
