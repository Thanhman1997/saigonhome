import type React from "react"
import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"
import "@fontsource-variable/dm-sans"
import "@fontsource-variable/cormorant-garamond"
import "@fontsource-variable/jetbrains-mono"
import "@fontsource-variable/noto-sans"
import "@fontsource-variable/playfair-display"
import "@fontsource/dm-serif-display"
import "@fontsource-variable/lora"
import "@fontsource-variable/manrope"
import "@fontsource-variable/inter"
import { SiteAnalytics } from "@/components/site-analytics"
import { LanguageProvider } from "@/lib/i18n/language-provider"
import { getLayoutSiteData } from "@/lib/data"
import { buildDesignTokenCss, DESIGN_PRESETS } from "@/lib/design-tokens"
import "@fontsource-variable/noto-sans-kr"
import "@fontsource-variable/noto-serif-kr"
import "./globals.css"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lotus-wellness.vercel.app"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lotus Wellness — Mobile Massage, Delivered to Your Door",
    template: "%s | Lotus Wellness",
  },
  description:
    "Professional mobile massage brought to your hotel room, apartment, or residence in Ho Chi Minh City. Book vetted therapists, view transparent pricing, and choose your preferred time — in English, Korean, or Vietnamese.",
  keywords: [
    "mobile massage Ho Chi Minh City",
    "hotel massage Saigon",
    "massage booking Vietnam",
    "in-room massage HCMC",
    "Lotus Wellness",
  ],
  alternates: { canonical: "/" },
  icons: { apple: "/apple-icon.png", icon: "/icon.svg" },
  openGraph: {
    title: "Lotus Wellness — Mobile Massage, Delivered to Your Door",
    description: "Excellence, convenience, affordability, and privacy — professional massage wherever you are.",
    url: siteUrl,
    siteName: "Lotus Wellness",
    type: "website",
    locale: "en_US",
    images: [{ url: "/images/hero.jpg", width: 1200, height: 630, alt: "Lotus Wellness mobile massage" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lotus Wellness — Mobile Massage, Delivered to Your Door",
    description: "Professional mobile massage in Ho Chi Minh City.",
    images: ["/images/hero.jpg"],
  },
  generator: "v0.app",
}

export const viewport: Viewport = { themeColor: "#FCE2C1", width: "device-width", initialScale: 1, userScalable: true }

// Locale and design tokens come from the database, so this root layout must
// render at runtime instead of trying to connect during static generation.
export const dynamic = "force-dynamic"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const savedLocale = cookieStore.get("lotus-wellness-locale")?.value
  const { defaultLocale: databaseLocale, designSettings, sectionStyles, contactInfo } = await getLayoutSiteData()
  const defaultLocale = savedLocale === "en" || savedLocale === "vi" || savedLocale === "ko" ? savedLocale : databaseLocale
  // Keep the public Lotus experience aligned with the approved reference preset.
  // Legacy database rows may contain the previous muted palette and make the page appear broken.
  const activeDesign = designSettings?.presetKey === "lotus-premium" ? DESIGN_PRESETS[0].values : (designSettings ?? DESIGN_PRESETS[0].values)
  const designTokenCss = buildDesignTokenCss(activeDesign)
  const safe = (value: string | null) => value && /^[#(),.%\- a-zA-Z0-9]+$/.test(value) ? value : "inherit"
  const sectionStyleCss = sectionStyles.map((style) => `#${style.sectionKey} h1,#${style.sectionKey} h2,#${style.sectionKey} h3{color:${safe(style.titleColor)};font-size:${safe(style.titleSize === "sm" ? "1.5rem" : style.titleSize === "lg" ? "3rem" : "2rem")};text-align:${style.sectionKey === "services" || style.sectionKey === "experts" ? "center" : "inherit"}}#${style.sectionKey} p{color:${safe(style.bodyColor)};font-size:${safe(style.bodySize === "sm" ? "0.875rem" : style.bodySize === "lg" ? "1.25rem" : "1rem")}}`).join("")

  return (
    <html lang={defaultLocale} data-scroll-behavior="smooth" className="bg-background" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
      >
        <style id="design-tokens" dangerouslySetInnerHTML={{ __html: designTokenCss }} />
        <style id="section-styles" dangerouslySetInnerHTML={{ __html: sectionStyleCss }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
          { "@context": "https://schema.org", "@type": "WebSite", name: "Lotus Wellness", url: siteUrl },
          {
          "@context": "https://schema.org",
          "@type": "HealthAndBeautyBusiness",
          name: "Lotus Wellness",
          url: siteUrl,
          image: `${siteUrl}/images/hero.jpg`,
          ...(contactInfo?.phone ? { telephone: contactInfo.phone } : {}),
          ...(contactInfo?.addressEn ? { address: { "@type": "PostalAddress", streetAddress: contactInfo.addressEn, addressCountry: "VN" } } : {}),
          areaServed: "Ho Chi Minh City",
          priceRange: "$$",
          }
        ]) }} />
        <LanguageProvider defaultLocale={defaultLocale}>{children}</LanguageProvider>
        <SiteAnalytics />
      </body>
    </html>
  )
}
