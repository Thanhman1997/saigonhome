"use client"

import { ArrowRight, Clock3, Flower2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBooking, type ServiceWithDurations } from "@/lib/booking-context"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { formatVnd } from "@/lib/pricing"

export function ServicesSection({ services }: { services: ServiceWithDurations[] }) {
  const { t, locale } = useLanguage()
  const { openBooking } = useBooking()

  return (
    <section id="services" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker">{t.services.kicker}</p>
          <h2 className="section-title">{t.services.title}</h2>
          <p className="section-copy">{t.services.subtitle}</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 6).map((service, index) => {
            const name = pickLocalized({ en: service.nameEn, ko: service.nameKo, vi: service.nameVi }, locale)
            const desc = pickLocalized({ en: service.descEn, ko: service.descKo, vi: service.descVi }, locale)
            const firstDuration = service.durations[0]
            return (
              <article key={service.id} className="group flex min-h-[410px] flex-col overflow-hidden rounded-xl border border-border bg-card transition-transform duration-300 hover:-translate-y-1">
                <div className="relative flex h-44 items-center justify-center overflow-hidden bg-secondary/65">
                  <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(135deg,transparent_25%,var(--border)_25%,var(--border)_26%,transparent_26%,transparent_75%,var(--border)_75%,var(--border)_76%,transparent_76%)] [background-size:32px_32px]" />
                  <div className="relative grid size-20 place-items-center rounded-full border border-accent/25 bg-background/80 text-accent"><Flower2 className="size-9" aria-hidden="true" /></div>
                  <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Image placeholder {String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-serif text-2xl font-semibold">{name}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  {firstDuration && <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm"><span className="flex items-center gap-2 text-muted-foreground"><Clock3 className="size-4" />{firstDuration.minutes} {t.services.minutes}</span><span className="font-semibold">{formatVnd(firstDuration.priceVnd)}</span></div>}
                  <Button variant="ghost" className="mt-auto justify-start px-0 text-accent hover:bg-transparent" onClick={() => openBooking({ serviceId: service.id, durationMinutes: firstDuration?.minutes ?? null })}>{t.services.book}<ArrowRight data-icon="inline-end" /></Button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
