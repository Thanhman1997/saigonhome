"use client"

import Image from "next/image"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import type { getActivePromotions } from "@/lib/data"
import { Percent, Users, Sparkles, CalendarClock } from "lucide-react"

function formatDate(dateValue: string, locale: "en" | "ko" | "vi") {
  const [year, month, day] = dateValue.split("-").map(Number)
  if (!year || !month || !day) return dateValue
  if (locale === "ko") return `${year}. ${month}. ${day}.`
  if (locale === "vi") return `${day}/${month}/${year}`
  return `${month}/${day}/${year}`
}

type PromotionRow = Awaited<ReturnType<typeof getActivePromotions>>[number]

const ICONS: Record<string, typeof Sparkles> = {
  first_time: Sparkles,
  combo: Users,
  seasonal: CalendarClock,
}

export function Promotions({ promotions }: { promotions: PromotionRow[] }) {
  const { t: dict, locale } = useLanguage()
  const t = dict.promotions

  return (
    <section id="promotions" className="bg-muted py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">{t.kicker}</p>
          <h2 className="mt-3 text-balance font-sans text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
            {t.title}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{t.subtitle}</p>
        </div>

        {promotions.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo) => {
              const name = pickLocalized({ en: promo.nameEn, ko: promo.nameKo, vi: promo.nameVi }, locale)
              const desc = pickLocalized({ en: promo.descEn, ko: promo.descKo, vi: promo.descVi }, locale)
              const Icon = ICONS[promo.type] ?? Percent
              const isSeasonal = promo.type === "seasonal"

              return (
                <div
                  key={promo.id}
                  className="flex flex-col overflow-hidden border border-border bg-background"
                >
                  {promo.imageUrl && (
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                      <Image src={promo.imageUrl} alt={name} fill loading="lazy" sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-between p-8">
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                        {promo.discountLabel && (
                          <span className="border border-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                            {promo.discountLabel}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-6 font-serif text-2xl text-foreground">{name}</h3>
                      <p className="mt-3 leading-relaxed text-muted-foreground">{desc}</p>
                    </div>
                    {isSeasonal && promo.endDate && (
                      <p className="mt-6 text-xs uppercase tracking-wide text-primary">
                        {t.until}{" "}
                        {formatDate(promo.endDate, locale)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-12 text-sm text-muted-foreground">{t.none}</p>
        )}
      </div>
    </section>
  )
}
