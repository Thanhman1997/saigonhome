import { afterEach, describe, expect, it, vi } from "vitest"
import { getSiteUrl } from "./site-url"

afterEach(() => vi.unstubAllEnvs())

describe("getSiteUrl", () => {
  it("uses the exact Vercel deployment URL for preview email links", () => {
    vi.stubEnv("VERCEL_ENV", "preview")
    vi.stubEnv("VERCEL_URL", "saigon-home-preview.vercel.app")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app")

    expect(getSiteUrl()).toBe("https://saigon-home-preview.vercel.app")
  })

  it("keeps the configured custom domain in production", () => {
    vi.stubEnv("VERCEL_ENV", "production")
    vi.stubEnv("VERCEL_URL", "saigon-home-production.vercel.app")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app/")

    expect(getSiteUrl()).toBe("https://lotuswellness.app")
  })

  it("uses the configured URL outside Vercel", () => {
    vi.stubEnv("VERCEL_ENV", "")
    vi.stubEnv("VERCEL_URL", "")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://local.example.test/")

    expect(getSiteUrl()).toBe("https://local.example.test")
  })
})
