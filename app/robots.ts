import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lotus-wellness.vercel.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/payment/", "/api/", "/_next/", "/.well-known/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
