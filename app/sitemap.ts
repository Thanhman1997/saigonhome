import type { MetadataRoute } from "next"
import { getLayoutSiteData, getServicesWithDurations } from "@/lib/data"
import { localizedUrl } from "@/lib/seo"
import { SEO_LOCALES } from "@/lib/seo-constants"
import { getSiteUrl } from "@/lib/site-url"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const lastModified = new Date()
  const [services, { defaultLocale }] = await Promise.all([getServicesWithDurations(), getLayoutSiteData()])

  const multilingualPaths = ["/", "/booking", "/services", ...services.map((service) => `/services/${service.slug}`), "/reviews"]
  const entries: MetadataRoute.Sitemap = multilingualPaths.map((path) => {
    const languages: Record<string, string> = {}
    for (const locale of SEO_LOCALES) languages[locale] = localizedUrl(path, locale, defaultLocale)
    languages["x-default"] = `${siteUrl}${path === "/" ? "" : path}` || siteUrl
    return {
      url: localizedUrl(path, defaultLocale, defaultLocale),
      lastModified,
      changeFrequency: path === "/" || path.startsWith("/services/") ? "weekly" : "monthly",
      priority: path === "/" ? 1 : path.startsWith("/services/") ? 0.8 : 0.6,
      alternates: { languages },
    }
  })

  // One entry per language URL so each is discoverable and carries the full hreflang set.
  const localizedEntries = entries.flatMap((entry) =>
    SEO_LOCALES.filter((locale) => locale !== defaultLocale).map((locale) => {
      const path = entry.url.replace(siteUrl, "") || "/"
      return { ...entry, url: localizedUrl(path, locale, defaultLocale) }
    }),
  )

  const legal = ["/privacy", "/terms"].map((path) => ({ url: `${siteUrl}${path}`, lastModified, changeFrequency: "yearly" as const, priority: 0.3 }))
  return [...entries, ...localizedEntries, ...legal]
}
