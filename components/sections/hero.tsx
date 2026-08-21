"use client"

import Image from "next/image"
import { ArrowDown, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { useBooking } from "@/lib/booking-context"
import type { heroContent } from "@/lib/db/schema"

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
    <section id="top" className="relative min-h-[calc(100svh-5rem)] overflow-hidden bg-primary text-primary-foreground">
      <Image src={content.imageUrl} alt="Lotus Wellness mobile massage in a private hotel room" fill priority sizes="100vw" className="object-cover opacity-65 transition-transform duration-1000 hover:scale-[1.02]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.13_0.015_65/.94),oklch(0.13_0.015_65/.52),oklch(0.13_0.015_65/.08))]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-primary/40 to-transparent" />
      {content.visible && <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl flex-col justify-end px-5 py-12 lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <div className="mb-7 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-secondary"><ShieldCheck className="size-4" />{localized(content.kickerEn, content.kickerKo, content.kickerVi)}</div>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/60">Lotus Wellness · Ho Chi Minh City</p>
          <h1 className="max-w-3xl text-balance font-serif text-6xl font-light leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl">{localized(content.titleLine1En, content.titleLine1Ko, content.titleLine1Vi)}<br /><em className="font-light text-secondary">{localized(content.titleLine2En, content.titleLine2Ko, content.titleLine2Vi)}</em></h1>
          <p className="mt-7 max-w-xl text-pretty text-base font-light leading-relaxed text-primary-foreground/80 sm:text-lg">{localized(content.subtitleEn, content.subtitleKo, content.subtitleVi)}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button type="button" size="lg" onClick={() => openBooking()} className="rounded-full px-7 text-xs uppercase tracking-[0.16em]">
              {t.nav.book}
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/40 bg-transparent px-7 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <a href="#services">{t.hero.ctaSecondary}</a>
            </Button>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-primary-foreground/25 pt-5 text-[11px] uppercase tracking-[0.18em] text-primary-foreground/65 sm:flex-row sm:items-center sm:justify-between"><span>{t.hero.hours}</span><a href="#about" className="flex items-center gap-2 text-primary-foreground"><ArrowDown className="size-4" />Lotus Wellness</a></div>
      </div>}
    </section>
  )
}
