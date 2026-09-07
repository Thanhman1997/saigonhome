import type { MetadataRoute } from "next"
import { getServicesWithDurations } from "@/lib/data"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lotus-wellness.vercel.app"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()
  const services = await getServicesWithDurations()
  const paths = ["/", "/services", "/reviews", "/privacy", "/terms", ...services.map((service) => `/services/${service.slug}`)]
  return paths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/services/") ? 0.8 : 0.6,
  }))
}
