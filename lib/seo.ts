import { cookies, headers } from "next/headers"
import type { Metadata } from "next"
import { getLayoutSiteData } from "@/lib/data"
import { getSiteUrl } from "@/lib/site-url"
import { LOCALE_COOKIE, LOCALE_HEADER, OG_LOCALES, SEO_LOCALES, asSeoLocale, type SeoLocale } from "@/lib/seo-constants"

export type SeoContext = {
  /** Locale from a /vi or /ko URL prefix, or null on an unprefixed URL. */
  prefix: SeoLocale | null
  /** Locale served on unprefixed URLs (the site's configured default). */
  defaultLocale: SeoLocale
  /** Locale used to render this request. */
  locale: SeoLocale
}

export const SITE_NAME = "Lotus Wellness"
export const DEFAULT_OG_IMAGE = { url: "/images/hero.jpg", width: 1600, height: 1205 }

export async function getSeoContext(): Promise<SeoContext> {
  const [headerStore, cookieStore, site] = await Promise.all([headers(), cookies(), getLayoutSiteData()])
  const prefix = asSeoLocale(headerStore.get(LOCALE_HEADER))
  const cookieLocale = asSeoLocale(cookieStore.get(LOCALE_COOKIE)?.value)
  const defaultLocale = site.defaultLocale
  return { prefix, defaultLocale, locale: prefix ?? cookieLocale ?? defaultLocale }
}

export function localizedPath(path: string, locale: SeoLocale, defaultLocale: SeoLocale) {
  if (locale === defaultLocale) return path
  return path === "/" ? `/${locale}` : `/${locale}${path}`
}

export function localizedUrl(path: string, locale: SeoLocale, defaultLocale: SeoLocale) {
  return `${getSiteUrl()}${localizedPath(path, locale, defaultLocale)}`
}

/**
 * Canonical + hreflang for a page. The default-locale version lives on the
 * unprefixed URL; other languages live under /vi and /ko. A visit to a prefix
 * that equals the default locale canonicalises back to the unprefixed URL.
 */
export function buildAlternates(path: string, ctx: SeoContext, options: { singleLanguage?: boolean } = {}): NonNullable<Metadata["alternates"]> {
  if (options.singleLanguage) return { canonical: path }
  const canonicalLocale = ctx.prefix ?? ctx.defaultLocale
  const languages: Record<string, string> = {}
  for (const locale of SEO_LOCALES) languages[locale] = localizedPath(path, locale, ctx.defaultLocale)
  languages["x-default"] = path
  return { canonical: localizedPath(path, canonicalLocale, ctx.defaultLocale), languages }
}

type PageMetadataInput = {
  path: string
  ctx: SeoContext
  title: string | { absolute: string }
  description: string
  image?: { url: string; width?: number; height?: number; alt?: string }
  singleLanguage?: boolean
  noindex?: boolean
}

export function buildPageMetadata({ path, ctx, title, description, image = DEFAULT_OG_IMAGE, singleLanguage, noindex }: PageMetadataInput): Metadata {
  const alternates = buildAlternates(path, ctx, { singleLanguage })
  const ogTitle = typeof title === "string" ? `${title} | ${SITE_NAME}` : title.absolute
  const otherLocales = SEO_LOCALES.filter((locale) => locale !== ctx.locale).map((locale) => OG_LOCALES[locale])
  return {
    title,
    description,
    alternates,
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: ogTitle,
      description,
      url: alternates.canonical as string,
      siteName: SITE_NAME,
      type: "website",
      locale: OG_LOCALES[ctx.locale],
      ...(singleLanguage ? {} : { alternateLocale: otherLocales }),
      images: [{ ...image, alt: image.alt ?? SITE_NAME }],
    },
    twitter: { card: "summary_large_image", title: ogTitle, description, images: [image.url] },
  }
}

export function pickByLocale<T extends { en: string; vi: string; ko: string }>(value: T, locale: SeoLocale) {
  return value[locale] || value.en
}

/** Trim to a search-snippet friendly length without cutting mid-word. */
export function clipText(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`
}
