import { afterEach, describe, expect, it, vi } from "vitest"
import { getEmailSiteUrl, getSiteUrl } from "./site-url"

afterEach(() => vi.unstubAllEnvs())

describe("getSiteUrl", () => {
  it("uses the exact Vercel deployment URL for Preview site metadata", () => {
    vi.stubEnv("VERCEL_ENV", "preview")
    vi.stubEnv("VERCEL_URL", "saigon-home-preview.vercel.app")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app")

    expect(getSiteUrl()).toBe("https://saigon-home-preview.vercel.app")
  })

  it("uses the explicit branded Preview host for email links, not the temporary deployment host", () => {
    vi.stubEnv("VERCEL_ENV", "preview")
    vi.stubEnv("VERCEL_URL", "saigon-home-preview.vercel.app")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app")
    vi.stubEnv("PREVIEW_SITE_URL", "https://preview.lotuswellness.app/")

    expect(getEmailSiteUrl()).toBe("https://preview.lotuswellness.app")
  })

  it("fails closed if the Preview host is missing", () => {
    vi.stubEnv("VERCEL_ENV", "preview")
    vi.stubEnv("VERCEL_URL", "saigon-home-preview.vercel.app")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app")
    vi.stubEnv("PREVIEW_SITE_URL", "")

    expect(() => getEmailSiteUrl()).toThrow("PREVIEW_SITE_URL")
  })

  it.each([
    "https://lotuswellness.app",
    "https://saigon-home-preview.vercel.app",
    "http://preview.lotuswellness.app",
  ])("rejects unsafe Preview email host %s", (previewUrl) => {
    vi.stubEnv("VERCEL_ENV", "preview")
    vi.stubEnv("PREVIEW_SITE_URL", previewUrl)

    expect(() => getEmailSiteUrl()).toThrow()
  })

  it("uses only the canonical production domain for email links", () => {
    vi.stubEnv("VERCEL_ENV", "production")
    vi.stubEnv("VERCEL_URL", "saigon-home-production.vercel.app")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.app/")

    expect(getEmailSiteUrl()).toBe("https://lotuswellness.app")
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
