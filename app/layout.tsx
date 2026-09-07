import type React from "react"
import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"
import {
  DM_Sans,
  Cormorant_Garamond,
  JetBrains_Mono,
  Noto_Sans,
  Noto_Sans_KR,
  Noto_Serif_KR,
  Playfair_Display,
  DM_Serif_Display,
  Lora,
  Manrope,
  Inter,
} from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/lib/i18n/language-provider"
import { getContactInfo, getDefaultLocale, getDesignSettings, getSectionStyles } from "@/lib/data"
import { buildDesignTokenCss, DESIGN_PRESETS, FONT_OPTIONS } from "@/lib/design-tokens"
import "./globals.css"

// Primary display fonts (Latin only). Weight lists are kept minimal — each
// extra weight is a separate .woff2 file, and loading dozens of font files at
// once can exhaust the browser (net::ERR_INSUFFICIENT_RESOURCES).
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["400", "500", "600", "700"] })
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "600", "700"],
})
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", weight: ["400"] })

// Fallback fonts so Korean and Vietnamese text always render, regardless of
// the visitor's system fonts. These are chained after the primary fonts in
// globals.css so the browser only falls back per-glyph when a character is
// missing (e.g. Hangul or Vietnamese diacritics).
const notoSans = Noto_Sans({ subsets: ["latin", "vietnamese"], variable: "--font-noto-sans", weight: ["400", "500", "700"] })
const notoSansKr = Noto_Sans_KR({ variable: "--font-noto-sans-kr", weight: ["400", "500", "700"], preload: false })
const notoSerifKr = Noto_Serif_KR({ variable: "--font-noto-serif-kr", weight: ["400", "600", "700"], preload: false })

// Vetted, Admin-selectable Design Settings font pool. Preloaded here (never
// injected as arbitrary CSS) so the Design Settings module can only switch
// between these known-safe families.
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["400", "600", "700"], preload: false })
const dmSerifDisplay = DM_Serif_Display({ subsets: ["latin"], variable: "--font-dm-serif-display", weight: ["400"], preload: false })
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", weight: ["400", "600", "700"], preload: false })
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["400", "600", "700"], preload: false })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "600", "700"], preload: false })

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
  const [databaseLocale, designSettings, sectionStyles, contactInfo] = await Promise.all([getDefaultLocale(), getDesignSettings(), getSectionStyles(), getContactInfo()])
  const defaultLocale = savedLocale === "en" || savedLocale === "vi" || savedLocale === "ko" ? savedLocale : databaseLocale
  // Keep the public Lotus experience aligned with the approved reference preset.
  // Legacy database rows may contain the previous muted palette and make the page appear broken.
  const activeDesign = designSettings?.presetKey === "lotus-premium" ? DESIGN_PRESETS[0].values : (designSettings ?? DESIGN_PRESETS[0].values)
  const designTokenCss = buildDesignTokenCss(activeDesign)
  const safe = (value: string | null) => value && /^[#(),.%\- a-zA-Z0-9]+$/.test(value) ? value : "inherit"
  // Turn a stored section font key into a font-family declaration. Only keys
  // from the vetted FONT_OPTIONS pool resolve to a CSS variable; anything else
  // (including "inherit") falls back to inheriting the site font.
  const fontDecl = (key: string | null | undefined) => {
    const option = FONT_OPTIONS.find((f) => f.key === key)
    return option ? `font-family:var(${option.cssVar}),${option.category};` : ""
  }
  const sectionStyleCss = sectionStyles.map((style) => `#${style.sectionKey} h1,#${style.sectionKey} h2,#${style.sectionKey} h3{${fontDecl(style.titleFont)}color:${safe(style.titleColor)};font-size:${safe(style.titleSize === "sm" ? "1.5rem" : style.titleSize === "lg" ? "3rem" : "2rem")};text-align:${style.sectionKey === "services" || style.sectionKey === "experts" ? "center" : "inherit"}}#${style.sectionKey} p{${fontDecl(style.bodyFont)}color:${safe(style.bodyColor)};font-size:${safe(style.bodySize === "sm" ? "0.875rem" : style.bodySize === "lg" ? "1.25rem" : "1rem")}}`).join("")

  return (
    <html lang="en" data-scroll-behavior="smooth" className="bg-background" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${cormorant.variable} ${jetbrainsMono.variable} ${notoSans.variable} ${notoSansKr.variable} ${notoSerifKr.variable} ${playfair.variable} ${dmSerifDisplay.variable} ${lora.variable} ${manrope.variable} ${inter.variable} font-sans antialiased`}
      >
        <style id="design-tokens" dangerouslySetInnerHTML={{ __html: designTokenCss }} />
        <style id="section-styles" dangerouslySetInnerHTML={{ __html: sectionStyleCss }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HealthAndBeautyBusiness",
          name: "Lotus Wellness",
          url: siteUrl,
          image: `${siteUrl}/images/hero.jpg`,
          ...(contactInfo?.phone ? { telephone: contactInfo.phone } : {}),
          ...(contactInfo?.addressEn ? { address: { "@type": "PostalAddress", streetAddress: contactInfo.addressEn, addressCountry: "VN" } } : {}),
          areaServed: "Ho Chi Minh City",
          priceRange: "$$",
        }) }} />
        <LanguageProvider defaultLocale={defaultLocale}>{children}</LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
