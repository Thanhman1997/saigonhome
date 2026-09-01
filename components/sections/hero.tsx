"use client"

import Image from "next/image"
import { ArrowDown, ShieldCheck } from "lucide-react"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { useBooking } from "@/lib/booking-context"
import type { heroContent } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"

type Hero = typeof heroContent.$inferSelect | null

export function HeroSection({ hero }: { hero: Hero }) {
  const { t, locale } = useLanguage()
  const { openBooking } = useBooking()
  const content = hero ?? {
    imageUrl: "/images/spa-hero.png", visible: true,
    kickerEn: t.hero.kicker, kickerKo: t.hero.kicker, kickerVi: t.hero.kicker,
    titleLine1En: t.hero.titleLine1, titleLine1Ko: t.hero.titleLine1, titleLine1Vi: t.hero.titleLine1,
    titleLine2En: t.hero.titleLine2, titleLine2Ko: t.hero.titleLine2, titleLine2Vi: t.hero.titleLine2,
    subtitleEn: t.hero.subtitle, subtitleKo: t.hero.subtitle, subtitleVi: t.hero.subtitle,
    ctaEn: t.hero.cta, ctaKo: t.hero.cta, ctaVi: t.hero.cta,
  }
  const localized = (en: string, ko: string, vi: string) => pickLocalized({ en, ko, vi }, locale)

  return (
    <section id="top" className="overflow-hidden bg-card text-foreground">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[.85fr_1.15fr]">
        <div className="flex flex-col justify-center px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-12">
          {content.visible && <>
            <div className="reveal-up mb-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-accent"><ShieldCheck className="size-4" />{localized(content.kickerEn, content.kickerKo, content.kickerVi)}</div>
            <h1 className="reveal-up reveal-delay-1 max-w-3xl text-balance font-serif font-light tracking-tight" style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)", lineHeight: 1.02 }}>{localized(content.titleLine1En, content.titleLine1Ko, content.titleLine1Vi)}<br /><em className="font-light text-accent">{localized(content.titleLine2En, content.titleLine2Ko, content.titleLine2Vi)}</em></h1>
            <p className="reveal-up reveal-delay-2 mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">{localized(content.subtitleEn, content.subtitleKo, content.subtitleVi)}</p>
            <div className="reveal-up reveal-delay-3 mt-8 flex flex-wrap items-center gap-4"><Button onClick={() => openBooking()} className="h-12 rounded-full bg-accent px-7 text-base font-semibold text-accent-foreground hover:bg-accent/90">{localized(content.ctaEn, content.ctaKo, content.ctaVi)}</Button><a href="#about" className="flex items-center gap-2 text-sm font-medium text-foreground"><ArrowDown className="size-4" />{t.hero.hours}</a></div>
          </>}
        </div>
        <div className="relative min-h-[24rem] overflow-hidden lg:min-h-[42rem]"><Image src={content.imageUrl} alt="Lotus Wellness mobile massage in a private home" fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover object-center saturate-110 transition-transform duration-700 hover:scale-[1.03]" /><div className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" /><div className="absolute bottom-5 left-5 rounded-full border border-card/40 bg-card/80 px-4 py-2 text-xs uppercase tracking-[0.18em] text-foreground backdrop-blur-sm">{t.hero.hours}</div></div>
      </div>
    </section>
  )
}
