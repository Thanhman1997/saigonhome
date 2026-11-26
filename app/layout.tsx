import type React from "react"
import type { Metadata, Viewport } from "next"
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
import { getSiteUrl } from "@/lib/site-url"
import { DEFAULT_OG_IMAGE, SITE_NAME, getSeoContext } from "@/lib/seo"
import { OG_LOCALES } from "@/lib/seo-constants"
import { seoCopy } from "@/lib/seo-copy"
import { buildDesignTokenCss, DESIGN_PRESETS, FONT_OPTIONS } from "@/lib/design-tokens"
import "@fontsource-variable/noto-sans-kr"
import "@fontsource-variable/noto-serif-kr"
import "./globals.css"

const siteUrl = getSiteUrl()

const SECTION_HEADING_SIZES: Record<string, string> = {
  inherit: "inherit",
  sm: "1.5rem",
  md: "2rem",
  lg: "3rem",
  "1.5rem": "1.5rem",
  "1.75rem": "1.75rem",
  "2rem": "2rem",
  "2.5rem": "2.5rem",
  "3rem": "3rem",
}
const SECTION_BODY_SIZES: Record<string, string> = {
  inherit: "inherit",
  sm: "0.875rem",
  md: "1rem",
  lg: "1.25rem",
  "0.875rem": "0.875rem",
  "1rem": "1rem",
  "1.125rem": "1.125rem",
  "1.25rem": "1.25rem",
  "1.5rem": "1.5rem",
}

function getSectionSize(value: string, kind: "heading" | "body") {
  const options = kind === "heading" ? SECTION_HEADING_SIZES : SECTION_BODY_SIZES
  return options[value] ?? "inherit"
}

function getSectionFont(value: string, fallback: string) {
  const font = FONT_OPTIONS.find((option) => option.key === value)
  return font ? `var(${font.cssVar})` : `var(${fallback})`
}

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSeoContext()
  const title = seoCopy.home.title[ctx.locale]
  const description = seoCopy.home.description[ctx.locale]
  return {
    metadataBase: new URL(siteUrl),
    applicationName: SITE_NAME,
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    icons: { apple: "/apple-icon.png", icon: "/icon.svg" },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: "website",
      locale: OG_LOCALES[ctx.locale],
      images: [{ ...DEFAULT_OG_IMAGE, alt: SITE_NAME }],
    },
    twitter: { card: "summary_large_image", title, description, images: [DEFAULT_OG_IMAGE.url] },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const { designSettings } = await getLayoutSiteData()
  const activeDesign = designSettings?.presetKey === "lotus-premium" ? DESIGN_PRESETS[0].values : (designSettings ?? DESIGN_PRESETS[0].values)
  return { themeColor: activeDesign.colorBackground, width: "device-width", initialScale: 1, userScalable: true }
}

// Locale and design tokens come from the database, so this root layout must
// render at runtime instead of trying to connect during static generation.
export const dynamic = "force-dynamic"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [seo, { designSettings, sectionStyles, contactInfo }] = await Promise.all([getSeoContext(), getLayoutSiteData()])
  const defaultLocale = seo.locale
  const sameAs = [contactInfo?.instagramUrl].filter((url): url is string => !!url && /^https?:\/\//i.test(url))
  // Keep the public Lotus experience aligned with the approved reference preset.
  // Legacy database rows may contain the previous muted palette and make the page appear broken.
  const activeDesign = designSettings?.presetKey === "lotus-premium" ? DESIGN_PRESETS[0].values : (designSettings ?? DESIGN_PRESETS[0].values)
  const designTokenCss = buildDesignTokenCss(activeDesign)
  const sectionStyleCss = sectionStyles.map((style) => {
    if (!/^[a-z-]+$/.test(style.sectionKey)) return ""
    const titleColor = style.titleColor && /^#[0-9a-fA-F]{6}$/.test(style.titleColor) ? style.titleColor : "inherit"
    const bodyColor = style.bodyColor && /^#[0-9a-fA-F]{6}$/.test(style.bodyColor) ? style.bodyColor : "inherit"
    const titleSize = getSectionSize(style.titleSize, "heading")
    const bodySize = getSectionSize(style.bodySize, "body")
    const titleAlign = ["left", "center", "right"].includes(style.titleAlign) ? style.titleAlign : "inherit"
    const bodyAlign = ["left", "center", "right"].includes(style.bodyAlign) ? style.bodyAlign : "inherit"
    const titleFont = getSectionFont(style.titleFont, "--font-serif")
    const bodyFont = getSectionFont(style.bodyFont, "--font-sans")
    return `#${style.sectionKey} h1,#${style.sectionKey} h2,#${style.sectionKey} h3{color:${titleColor};font-size:${titleSize};font-family:${titleFont};text-align:${titleAlign}}#${style.sectionKey} p{color:${bodyColor};font-size:${bodySize};font-family:${bodyFont};text-align:${bodyAlign}}`
  }).join("")

  return (
    <html lang={defaultLocale} data-scroll-behavior="smooth" className="bg-background" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
      >
        <style id="design-tokens" dangerouslySetInnerHTML={{ __html: designTokenCss }} />
        <style id="section-styles" dangerouslySetInnerHTML={{ __html: sectionStyleCss }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
          { "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteUrl}/#website`, name: SITE_NAME, url: siteUrl, inLanguage: ["en", "vi", "ko"] },
          {
          "@context": "https://schema.org",
          "@type": "HealthAndBeautyBusiness",
          "@id": `${siteUrl}/#business`,
          name: SITE_NAME,
          url: siteUrl,
          image: `${siteUrl}${DEFAULT_OG_IMAGE.url}`,
          logo: `${siteUrl}/images/lotus-wellness-logo.png`,
          ...(contactInfo?.phone ? { telephone: contactInfo.phone } : {}),
          ...(contactInfo?.email ? { email: contactInfo.email } : {}),
          ...(contactInfo?.addressEn ? { address: { "@type": "PostalAddress", streetAddress: contactInfo.addressEn, addressLocality: "Ho Chi Minh City", addressCountry: "VN" } } : {}),
          ...(sameAs.length ? { sameAs } : {}),
          areaServed: { "@type": "City", name: "Ho Chi Minh City" },
          availableLanguage: ["English", "Vietnamese", "Korean"],
          }
        ]) }} />
        <LanguageProvider defaultLocale={defaultLocale}>{children}</LanguageProvider>
        <SiteAnalytics />
      </body>
    </html>
  )
}
