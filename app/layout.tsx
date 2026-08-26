import type React from "react"
import type { Metadata, Viewport } from "next"
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
import { getDefaultLocale, getDesignSettings } from "@/lib/data"
import { buildDesignTokenCss, DESIGN_PRESETS } from "@/lib/design-tokens"
import "./globals.css"

// Primary display fonts (Latin only)
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["300", "400", "500", "600", "700"] })
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
})
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", weight: ["400", "500"] })

// Fallback fonts so Korean and Vietnamese text always render, regardless of
// the visitor's system fonts. These are chained after the primary fonts in
// globals.css so the browser only falls back per-glyph when a character is
// missing (e.g. Hangul or Vietnamese diacritics).
const notoSans = Noto_Sans({ subsets: ["latin", "vietnamese"], variable: "--font-noto-sans", weight: ["300", "400", "500", "600", "700"] })
const notoSansKr = Noto_Sans_KR({ variable: "--font-noto-sans-kr", weight: ["300", "400", "500", "600", "700"], preload: false })
const notoSerifKr = Noto_Serif_KR({ variable: "--font-noto-serif-kr", weight: ["300", "400", "500", "600", "700"], preload: false })

// Vetted, Admin-selectable Design Settings font pool. Preloaded here (never
// injected as arbitrary CSS) so the Design Settings module can only switch
// between these known-safe families.
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["400", "500", "600", "700"], preload: false })
const dmSerifDisplay = DM_Serif_Display({ subsets: ["latin"], variable: "--font-dm-serif-display", weight: ["400"], preload: false })
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", weight: ["400", "500", "600", "700"], preload: false })
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["400", "500", "600", "700"], preload: false })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600", "700"], preload: false })

export const metadata: Metadata = {
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
  openGraph: {
    title: "Lotus Wellness — Mobile Massage, Delivered to Your Door",
    description: "Excellence, convenience, affordability, and privacy — professional massage wherever you are.",
    type: "website",
    locale: "en_US",
  },
  generator: "v0.app",
}

export const viewport: Viewport = { themeColor: "#f5f0e7", width: "device-width", initialScale: 1, userScalable: true }

// Locale and design tokens come from the database, so this root layout must
// render at runtime instead of trying to connect during static generation.
export const dynamic = "force-dynamic"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [defaultLocale, designSettings] = await Promise.all([getDefaultLocale(), getDesignSettings()])
  const activeDesign = designSettings ?? DESIGN_PRESETS[0].values
  const designTokenCss = buildDesignTokenCss(activeDesign)

  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <style id="design-tokens" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: designTokenCss }} />
      </head>
      <body
        className={`${dmSans.variable} ${cormorant.variable} ${jetbrainsMono.variable} ${notoSans.variable} ${notoSansKr.variable} ${notoSerifKr.variable} ${playfair.variable} ${dmSerifDisplay.variable} ${lora.variable} ${manrope.variable} ${inter.variable} font-sans antialiased`}
      >
        <LanguageProvider defaultLocale={defaultLocale}>{children}</LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
