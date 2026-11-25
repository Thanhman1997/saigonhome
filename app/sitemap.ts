import type { MetadataRoute } from "next"
import { getServicesWithDurations } from "@/lib/data"
import { getSiteUrl } from "@/lib/site-url"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const lastModified = new Date()
  const services = await getServicesWithDurations()
  const paths = ["/", "/booking", "/services", ...services.map((service) => `/services/${service.slug}`), "/reviews", "/privacy", "/terms"]
  return paths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : path.startsWith("/services/") ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/services/") ? 0.8 : 0.6,
  }))
}
