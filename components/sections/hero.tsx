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
      <div className="mx-auto grid max-w-[88rem] items-center gap-8 px-6 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-10 lg:px-16 xl:px-20">
        <div className="flex flex-col justify-center py-10 sm:py-12 lg:py-12 lg:pl-4">
          {content.visible && <>
            <div className={`reveal-up mb-7 flex w-fit max-w-full items-center gap-3 font-sans text-lg font-medium tracking-[0.08em] text-accent sm:text-xl ${locale === "ko" ? "font-korean-sans not-italic tracking-wide" : ""}`}><ShieldCheck className="size-5 shrink-0" />{localized(content.kickerEn, content.kickerKo, content.kickerVi)}</div>
            <h1 className={`max-w-3xl text-balance font-sans font-normal leading-tight tracking-[-0.035em] ${locale === "ko" ? "font-korean-sans" : ""}`} style={{ fontSize: "clamp(1.75rem, 4vw, 3.75rem)" }}>{localized(content.titleLine1En, content.titleLine1Ko, content.titleLine1Vi)}<br /><span className="font-inherit text-accent capitalize">{localized(content.titleLine2En, content.titleLine2Ko, content.titleLine2Vi)}</span></h1>
            <p className="reveal-up reveal-delay-2 mt-7 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">{localized(content.subtitleEn, content.subtitleKo, content.subtitleVi)}</p>
            <div className="reveal-up reveal-delay-3 mt-10 flex flex-wrap items-center gap-4"><Button onClick={() => openBooking()} className={`h-14 ${locale === "ko" ? "w-32 text-xl font-korean-sans sm:w-36 sm:text-2xl" : locale === "en" ? "w-32 text-base sm:w-36 sm:text-lg" : "w-36 text-xl sm:w-40 sm:text-2xl"} shrink-0 rounded-full bg-accent px-5 font-extrabold text-accent-foreground hover:bg-accent/90`}>{locale === "en" ? "BOOK NOW" : localized(content.ctaEn, content.ctaKo, content.ctaVi)}</Button><a href="#about" className="flex items-center gap-2 text-base font-medium text-foreground sm:text-lg"><ArrowDown className="size-5" />{t.hero.hours}</a></div>
          </>}
        </div>
        <div className="relative min-h-[22rem] overflow-hidden sm:min-h-[26rem] lg:min-h-[34rem] xl:min-h-[40rem]"><Image src={content.imageUrl} alt="Lotus Wellness mobile massage in a private home" fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover object-center saturate-110 transition-transform duration-700 hover:scale-[1.03]" /><div className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" /></div>
      </div>
    </section>
  )
}
