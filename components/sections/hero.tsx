"use client"

import Image from "next/image"
import { ArrowDown, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import type { heroContent } from "@/lib/db/schema"

type Hero = typeof heroContent.$inferSelect | null

export function HeroSection({ hero }: { hero: Hero }) {
  const { t, locale } = useLanguage()
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
    <section id="top" className="relative min-h-[calc(100svh-5rem)] overflow-hidden bg-secondary text-foreground">
      <Image src={content.imageUrl} alt="Lotus Wellness mobile massage in a private hotel room" fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover object-center opacity-90 saturate-110 lg:left-[38%] lg:w-[62%]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--secondary)_96%,transparent)_0%,color-mix(in_oklab,var(--secondary)_72%,transparent)_36%,transparent_70%)]" />
      {content.visible && <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl flex-col justify-end px-5 py-12 lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <div className="mb-7 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-accent"><ShieldCheck className="size-4" />{localized(content.kickerEn, content.kickerKo, content.kickerVi)}</div>
          <h1 className="max-w-3xl text-balance font-serif text-6xl font-light leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl">{localized(content.titleLine1En, content.titleLine1Ko, content.titleLine1Vi)}<br /><em className="font-light text-accent">{localized(content.titleLine2En, content.titleLine2Ko, content.titleLine2Vi)}</em></h1>
          <p className="mt-7 max-w-xl text-pretty text-base font-light leading-relaxed text-foreground/80 sm:text-lg">{localized(content.subtitleEn, content.subtitleKo, content.subtitleVi)}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-foreground hover:bg-primary-foreground hover:text-primary"><a href="#services">{t.hero.ctaSecondary}</a></Button></div>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-primary-foreground/25 pt-5 text-[11px] uppercase tracking-[0.18em] text-foreground/65 sm:flex-row sm:items-center sm:justify-between"><span>{t.hero.hours}</span><a href="#about" className="flex items-center gap-2 text-foreground"><ArrowDown className="size-4" />Lotus Wellness</a></div>
      </div>}
    </section>
  )
}
