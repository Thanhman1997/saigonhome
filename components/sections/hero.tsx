"use client"

import Image from "next/image"
import { ArrowDown, ShieldCheck } from "lucide-react"
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
    <section id="top" className="overflow-hidden bg-secondary text-foreground">
      <div className="relative h-[52svh] min-h-[20rem] w-full lg:h-[62svh]">
        <Image src={content.imageUrl} alt="Lotus Wellness mobile massage in a private hotel room" fill priority sizes="100vw" className="object-cover object-center opacity-95 saturate-125" />
      </div>
      {content.visible && <div className="mx-auto flex max-w-7xl flex-col px-5 py-10 sm:py-12 lg:px-8 lg:py-14">
        <div className="max-w-3xl">
          <div className="mb-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-accent"><ShieldCheck className="size-4" />{localized(content.kickerEn, content.kickerKo, content.kickerVi)}</div>
          <h1 className="max-w-3xl text-balance font-serif font-light tracking-tight" style={{ fontSize: "clamp(3rem, 7vw, 7.5rem)", lineHeight: 1.08 }}>{localized(content.titleLine1En, content.titleLine1Ko, content.titleLine1Vi)}<br /><em className="font-light text-accent">{localized(content.titleLine2En, content.titleLine2Ko, content.titleLine2Vi)}</em></h1>
          <p className="mt-5 max-w-xl text-pretty text-base font-light leading-relaxed text-foreground/80 sm:text-lg">{localized(content.subtitleEn, content.subtitleKo, content.subtitleVi)}</p>
        </div>
        <div className="mt-8 flex flex-col gap-4 border-t border-primary-foreground/25 pt-5 text-[11px] uppercase tracking-[0.18em] text-foreground/65 sm:flex-row sm:items-center sm:justify-between"><span>{t.hero.hours}</span><a href="#about" className="flex items-center gap-2 text-foreground"><ArrowDown className="size-4" />Lotus Wellness</a></div>
      </div>}
    </section>
  )
}
