"use client"

import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { useBooking, type ServiceWithDurations } from "@/lib/booking-context"
import { formatVnd } from "@/lib/pricing"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const fallbackImages: Record<string, { src: string; flag: string }> = {
  thai: { src: "/images/service-thai.png", flag: "TH" },
  swedish: { src: "/images/service-swedish.png", flag: "SE" },
  vietnamese: { src: "/images/service-vietnamese.png", flag: "VN" },
  aroma: { src: "/images/service-aroma.png", flag: "AR" },
  "deep-tissue": { src: "/images/service-deep-tissue.png", flag: "DT" },
  "hot-stone": { src: "/images/service-hot-stone.png", flag: "HS" },
  reflexology: { src: "/images/service-reflexology.png", flag: "RF" },
  "office-syndrome": { src: "/images/service-office-syndrome.png", flag: "OS" },
  "traveler-recover": { src: "/images/service-traveler-recovery.png", flag: "TR" },
}

function imageForService(service: ServiceWithDurations) {
  return fallbackImages[service.slug] ?? { src: "/images/service-thai.png", flag: "LW" }
}

type ServicesContent = { kickerEn: string; kickerKo: string; kickerVi: string; titleEn: string; titleKo: string; titleVi: string; subtitleEn: string; subtitleKo: string; subtitleVi: string }

export function ServicesSection({ services, featured = services.slice(0, 3), fullPage = false, content }: { services: ServiceWithDurations[]; featured?: ServiceWithDurations[]; fullPage?: boolean; content?: ServicesContent | null }) {
  const { t, locale } = useLanguage()
  const displayedServices = fullPage ? services : featured
  const { openBooking } = useBooking()
  const servicesContent = content ?? { kickerEn: t.services.kicker, kickerKo: t.services.kicker, kickerVi: t.services.kicker, titleEn: t.services.title, titleKo: t.services.title, titleVi: t.services.title, subtitleEn: t.services.subtitle, subtitleKo: t.services.subtitle, subtitleVi: t.services.subtitle }
  const localizedContent = (en: string, ko: string, vi: string) => pickLocalized({ en, ko, vi }, locale)

  return (
    <section id="services" className="bg-muted py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {t.services.kicker ? <p className="text-3xl font-extrabold uppercase tracking-[0.18em] text-accent">{localizedContent(servicesContent.kickerEn, servicesContent.kickerKo, servicesContent.kickerVi)}</p> : null}
          <h2 className="mt-4 text-center font-sans text-[clamp(3.6rem,6.5vw,6.5rem)] font-black leading-[1.08] tracking-[-0.03em] text-accent">{localizedContent(servicesContent.titleEn, servicesContent.titleKo, servicesContent.titleVi)}</h2>
          <p className="mx-auto mt-5 max-w-4xl text-center font-sans text-3xl font-semibold leading-relaxed text-muted-foreground">{localizedContent(servicesContent.subtitleEn, servicesContent.subtitleKo, servicesContent.subtitleVi)}</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayedServices.map((service) => {
            const localizedName = pickLocalized({ en: service.nameEn, ko: service.nameKo, vi: service.nameVi }, locale)
            const name = localizedName
            const desc = pickLocalized({ en: service.descEn, ko: service.descKo, vi: service.descVi }, locale)
            const fallback = imageForService(service)
            const image = service.imageUrl || fallback?.src

            return (
              <article key={service.id} className="reveal-up flex flex-col justify-between gap-7 rounded-xl border border-border/70 bg-card p-4 shadow-[0_12px_40px_-30px_rgba(92,48,20,0.5)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_48px_-28px_rgba(92,48,20,0.55)] sm:p-5">
                <div>
                  <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-secondary">
                    {image ? <Image src={image} alt={name} fill loading="lazy" className="object-cover" sizes="(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 92vw" /> : <span className="absolute inset-0 grid place-items-center text-4xl" aria-hidden="true">{service.icon}</span>}
                  </div>
                  <div className="px-1">
                    <h3 className={`font-sans leading-tight ${locale === "en" || locale === "vi" ? "text-3xl font-semibold" : "text-2xl font-medium"}`}>{name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                    <div className="mt-5 flex flex-col gap-1.5 border-t border-border pt-4">
                      {service.durations.map((d) => <div key={d.id} className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{d.minutes} {t.services.minutes}</span><span className="font-medium">{formatVnd(d.priceVnd)}</span></div>)}
                    </div>
                  </div>
                </div>
                <Button onClick={() => openBooking({ serviceId: service.id, durationMinutes: service.durations[0]?.minutes ?? null })} className="h-14 min-h-14 w-1/2 self-center rounded-full bg-lotus-pink px-4 font-sans text-lg font-semibold leading-none text-lotus-pink-foreground hover:bg-lotus-pink/90">{t.services.book}</Button>
              </article>
            )
          })}
        </div>
        {!fullPage && <div className="mt-10 flex justify-center"><Link href="/services" className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">{t.services.viewAll}</Link></div>}
      </div>
    </section>
  )
}
