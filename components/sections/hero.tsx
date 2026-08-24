"use client"

import Image from "next/image"
import { ArrowRight, CalendarClock, HeartHandshake, Leaf, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/lib/booking-context"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import type { heroContent } from "@/lib/db/schema"

type Hero = typeof heroContent.$inferSelect | null

export function HeroSection({ hero }: { hero: Hero }) {
  const { t, locale } = useLanguage()
  const { openBooking } = useBooking()
  const localized = (en: string, ko: string, vi: string) => pickLocalized({ en, ko, vi }, locale)
  const content = hero ?? {
    imageUrl: "/images/spa-hero.png", visible: true,
    kickerEn: t.hero.kicker, kickerKo: t.hero.kicker, kickerVi: t.hero.kicker,
    titleLine1En: t.hero.titleLine1, titleLine1Ko: t.hero.titleLine1, titleLine1Vi: t.hero.titleLine1,
    titleLine2En: t.hero.titleLine2, titleLine2Ko: t.hero.titleLine2, titleLine2Vi: t.hero.titleLine2,
    subtitleEn: t.hero.subtitle, subtitleKo: t.hero.subtitle, subtitleVi: t.hero.subtitle,
    ctaEn: t.hero.cta, ctaKo: t.hero.cta, ctaVi: t.hero.cta,
  }
  const benefits = [
    { icon: Leaf, title: locale === "vi" ? "Sản phẩm chọn lọc" : locale === "ko" ? "엄선된 제품" : "Considered products", text: locale === "vi" ? "Dầu và sản phẩm chất lượng" : locale === "ko" ? "품질 좋은 오일과 제품" : "Quality oils and essentials" },
    { icon: HeartHandshake, title: locale === "vi" ? "Chuyên viên phù hợp" : locale === "ko" ? "맞춤 테라피스트" : "Matched therapist", text: locale === "vi" ? "Chọn theo nhu cầu của bạn" : locale === "ko" ? "필요에 맞춘 선택" : "Choose for your needs" },
    { icon: ShieldCheck, title: locale === "vi" ? "Riêng tư & chuyên nghiệp" : locale === "ko" ? "프라이빗 & 전문적" : "Private & professional", text: locale === "vi" ? "Chăm sóc tại không gian của bạn" : locale === "ko" ? "내 공간에서 받는 케어" : "Care in your own space" },
    { icon: CalendarClock, title: locale === "vi" ? "Đặt lịch linh hoạt" : locale === "ko" ? "유연한 예약" : "Flexible booking", text: locale === "vi" ? "Chọn thời gian thuận tiện" : locale === "ko" ? "편한 시간에 예약" : "Times that work for you" },
  ]

  return (
    <>
      <section id="top" className="relative overflow-hidden border-b border-border bg-background">
        <div className="mx-auto grid min-h-[690px] max-w-7xl lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex flex-col justify-center px-5 py-20 lg:px-8 lg:py-28">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.24em] text-accent">{localized(content.kickerEn, content.kickerKo, content.kickerVi)}</p>
            <h1 className="max-w-2xl text-balance font-serif text-6xl font-medium leading-[0.94] tracking-[-0.035em] sm:text-7xl lg:text-[5.4rem]">
              {localized(content.titleLine1En, content.titleLine1Ko, content.titleLine1Vi)}<br />
              <em className="font-normal text-accent">{localized(content.titleLine2En, content.titleLine2Ko, content.titleLine2Vi)}</em>
            </h1>
            <p className="mt-7 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">{localized(content.subtitleEn, content.subtitleKo, content.subtitleVi)}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => openBooking()}>{localized(content.ctaEn, content.ctaKo, content.ctaVi)}<ArrowRight data-icon="inline-end" /></Button>
              <Button asChild size="lg" variant="outline"><a href="#services">{t.hero.ctaSecondary}</a></Button>
            </div>
            <p className="mt-7 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-accent" aria-hidden="true" />{t.hero.hours}</p>
          </div>
          <div className="relative min-h-[420px] overflow-hidden bg-muted lg:min-h-full">
            <Image src={content.imageUrl || "/images/spa-hero.png"} alt="A calm private massage setting prepared by Lotus Wellness" fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background),transparent_20%)] opacity-70" />
            <div className="absolute bottom-6 right-6 max-w-48 rounded-xl border border-background/70 bg-background/90 p-4 backdrop-blur">
              <p className="font-serif text-lg leading-tight">{locale === "vi" ? "Wellness đến tận nơi" : locale === "ko" ? "찾아가는 웰니스" : "Wellness, brought to you"}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Ho Chi Minh City</p>
            </div>
          </div>
        </div>
      </section>
      <section aria-label="Lotus Wellness benefits" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 lg:grid-cols-4 lg:px-8">
          {benefits.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className={`flex gap-3 py-6 ${index % 2 ? "pl-5" : "pr-5"} lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0`}>
              <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
              <div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p></div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
