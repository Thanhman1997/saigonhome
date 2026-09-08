"use client"

import { useState } from "react"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { useBooking, type ServiceWithDurations } from "@/lib/booking-context"
import { formatVnd } from "@/lib/pricing"
import Image from "next/image"
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
  "mens-tress-relief": { src: "/images/service-office-syndrome.png", flag: "MR" },
  "men-full-body": { src: "/images/service-deep-tissue.png", flag: "FB" },
}

function imageForService(service: ServiceWithDurations) {
  return fallbackImages[service.slug] ?? { src: "/images/service-thai.png", flag: "LW" }
}

type ServicesContent = { kickerEn: string; kickerKo: string; kickerVi: string; titleEn: string; titleKo: string; titleVi: string; subtitleEn: string; subtitleKo: string; subtitleVi: string }

function withServiceCount(text: string, count: number, locale: "en" | "ko" | "vi") {
  if (locale === "ko") return text.replace(/\d+가지/, `${count}가지`)
  if (locale === "vi") return text.replace(/Mười một|Chín|Nine|Eleven/i, count === 11 ? "Mười một" : String(count))
  return text.replace(/Nine|Eleven|\d+/i, String(count))
}

export function ServicesSection({ services, featured = services.slice(0, 3), fullPage = false, content }: { services: ServiceWithDurations[]; featured?: ServiceWithDurations[]; fullPage?: boolean; content?: ServicesContent | null }) {
  const { t, locale } = useLanguage()
  const [showAll, setShowAll] = useState(false)
  const displayedServices = fullPage ? services : showAll ? services : featured
  const { openBooking } = useBooking()
  const servicesContent = content ?? { kickerEn: t.services.kicker, kickerKo: t.services.kicker, kickerVi: t.services.kicker, titleEn: t.services.title, titleKo: t.services.title, titleVi: t.services.title, subtitleEn: t.services.subtitle, subtitleKo: t.services.subtitle, subtitleVi: t.services.subtitle }
  const localizedContent = (en: string, ko: string, vi: string) => pickLocalized({ en, ko, vi }, locale)

  return (
    <section id="services" className="bg-header-background py-12 lg:py-16">
      <div className="mx-auto max-w-[100rem] px-5 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          {t.services.kicker ? <p className="section-heading text-center text-accent">{localizedContent(servicesContent.kickerEn, servicesContent.kickerKo, servicesContent.kickerVi)}</p> : null}
          <h2 className="mt-4 text-center text-balance text-4xl font-semibold leading-snug tracking-tight text-foreground sm:text-5xl">{localizedContent(servicesContent.titleEn, servicesContent.titleKo, servicesContent.titleVi)}</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center font-sans text-lg font-normal leading-relaxed text-muted-foreground">{withServiceCount(localizedContent(servicesContent.subtitleEn, servicesContent.subtitleKo, servicesContent.subtitleVi), services.length, locale)}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedServices.map((service) => {
            const localizedName = pickLocalized({ en: service.nameEn, ko: service.nameKo, vi: service.nameVi }, locale)
            const name = localizedName
            const desc = pickLocalized({ en: service.descEn, ko: service.descKo, vi: service.descVi }, locale)
            const fallback = imageForService(service)
            const image = service.imageUrl || fallback?.src

            return (
              <article key={service.id} className="reveal-up flex flex-col justify-between gap-4 rounded-[1rem] border border-border/50 bg-card p-3 shadow-[0_12px_36px_-32px_rgba(92,48,20,0.5)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_48px_-30px_rgba(92,48,20,0.48)] sm:p-4">
                <div>
                  <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-[0.9rem] bg-secondary">
                    {image ? <Image src={image} alt={name} fill loading="lazy" className="object-cover" sizes="(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 92vw" /> : <span className="absolute inset-0 grid place-items-center text-4xl" aria-hidden="true">{service.icon}</span>}
                  </div>
                  <div className="px-1">
                    <h3 className={`font-sans leading-tight ${locale === "en" || locale === "vi" ? "text-xl font-semibold" : "text-lg font-medium"}`}>{name}</h3>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{desc}</p>
                    <div className="mt-2 flex flex-col gap-0.5 border-t border-border pt-2">
                      {service.durations.map((d) => <div key={d.id} className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{d.minutes} {t.services.minutes}</span><span className="font-medium">{formatVnd(d.priceVnd)}</span></div>)}
                    </div>
                  </div>
                </div>
                <Button onClick={() => openBooking({ serviceId: service.id, durationMinutes: service.durations[0]?.minutes ?? null })} className="h-8 min-h-8 w-1/3 self-center rounded-full bg-accent px-3 font-sans text-xs font-semibold uppercase tracking-[0.06em] text-accent-foreground transition-transform duration-200 hover:-translate-y-0.5 hover:bg-accent/90">{t.services.book}</Button>
              </article>
            )
          })}
        </div>
        {!fullPage && !showAll && services.length > featured.length && <div className="mt-10 flex justify-center"><Button type="button" variant="outline" onClick={() => setShowAll(true)} className="rounded-full border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">{t.services.viewAll}</Button></div>}
      </div>
    </section>
  )
}
