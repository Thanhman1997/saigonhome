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

export function ServicesSection({ services, featured = services.slice(0, 3), fullPage = false }: { services: ServiceWithDurations[]; featured?: ServiceWithDurations[]; fullPage?: boolean }) {
  const { t, locale } = useLanguage()
  const displayedServices = fullPage ? services : featured
  const { openBooking } = useBooking()

  return (
    <section id="services" className="bg-muted py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className={locale === "ko" ? "max-w-2xl text-center" : "max-w-2xl"}>
          {t.services.kicker ? <p className="text-lg font-semibold uppercase tracking-[0.24em] text-accent">{t.services.kicker}</p> : null}
          <h2 className={locale === "ko" ? "mt-4 text-balance font-korean-sans text-5xl font-bold leading-tight tracking-tight text-accent sm:text-6xl" : "mt-4 text-balance font-sans text-7xl font-bold leading-tight tracking-tight sm:text-8xl"}>{t.services.title}</h2>
          <p className={locale === "ko" ? "mt-6 text-pretty text-xl leading-relaxed text-muted-foreground" : "mt-6 text-pretty text-lg leading-relaxed text-muted-foreground"}>{t.services.subtitle}</p>
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
                    <h3 className="font-serif text-2xl leading-tight">{name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                    <div className="mt-5 flex flex-col gap-1.5 border-t border-border pt-4">
                      {service.durations.map((d) => <div key={d.id} className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{d.minutes} {t.services.minutes}</span><span className="font-medium">{formatVnd(d.priceVnd)}</span></div>)}
                    </div>
                  </div>
                </div>
                <Button onClick={() => openBooking({ serviceId: service.id, durationMinutes: service.durations[0]?.minutes ?? null })} className={`h-14 min-h-14 w-1/2 self-center rounded-full px-4 font-bold bg-lotus-pink text-lotus-pink-foreground hover:bg-lotus-pink/90 ${locale === "ko" ? "text-2xl" : "text-lg"}`}>{t.services.book}</Button>
              </article>
            )
          })}
        </div>
        {!fullPage && <div className="mt-10 flex justify-center"><Link href="/services" className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">{t.services.viewAll}</Link></div>}
      </div>
    </section>
  )
}
