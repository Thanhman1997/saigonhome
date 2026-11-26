export const LOCALE_HEADER = "x-lotus-locale"
export const LOCALE_COOKIE = "lotus-wellness-locale"
export const SEO_LOCALES = ["en", "vi", "ko"] as const
export type SeoLocale = (typeof SEO_LOCALES)[number]
export const LOCALE_PREFIX_PATTERN = /^\/(en|vi|ko)(?=\/|$)/

export const OG_LOCALES: Record<SeoLocale, string> = { en: "en_US", vi: "vi_VN", ko: "ko_KR" }

export function asSeoLocale(value: unknown): SeoLocale | null {
  return value === "en" || value === "vi" || value === "ko" ? value : null
}
