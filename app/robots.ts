import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/payment/", "/api/", "/booking/manage", "/booking-review/", "/_next/", "/.well-known/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
