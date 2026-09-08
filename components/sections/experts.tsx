"use client"

import { useState } from "react"
import Image from "next/image"
import { Languages, MapPin, Ruler, BadgeCheck } from "lucide-react"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { useBooking, type TherapistRow } from "@/lib/booking-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 8

export function ExpertsSection({ therapists }: { therapists: TherapistRow[] }) {
  const { t, locale } = useLanguage()
  const { openBooking } = useBooking()
  const [visibleCount, setVisibleCount] = useState(Math.min(4, PAGE_SIZE))

  const visible = therapists.slice(0, visibleCount)

  return (
    <section id="experts" className="bg-header-background py-10 lg:py-14">
      <div className="mx-auto max-w-[80rem] px-8 lg:px-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mt-4 text-balance section-heading text-accent">{t.experts.title}</h2>
          <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground">{t.experts.subtitle}</p>
        </div>

        <div className="mx-auto mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-5xl lg:grid-cols-4">
          {visible.map((therapist) => {
            const location = pickLocalized(
              { en: therapist.locationEn ?? "", ko: therapist.locationKo ?? "", vi: therapist.locationVi ?? "" },
              locale,
            )
            const bio = pickLocalized({ en: therapist.bioEn ?? "", ko: therapist.bioKo ?? "", vi: therapist.bioVi ?? "" }, locale)

            return (
              <article key={therapist.id} className="flex flex-col overflow-hidden rounded-[1.25rem] border border-border/50 bg-secondary/70 shadow-[0_12px_36px_-32px_rgba(92,48,20,0.5)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_44px_-30px_rgba(92,48,20,0.48)]">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  <Image src={therapist.photoUrl!} alt={`Therapist ${therapist.code}`} fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 92vw" loading="lazy" className="object-cover" />
                  <span
                    className={cn(
                      "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider",
                      therapist.available ? "bg-secondary text-secondary-foreground" : "bg-muted-foreground/80 text-background",
                    )}
                  >
                    {therapist.available ? t.experts.available : t.experts.unavailable}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl">{therapist.code}</h3>
                    {therapist.experienceYears != null && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BadgeCheck className="size-3.5 text-accent" />
                        {therapist.experienceYears} {t.experts.years}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    {(therapist.heightCm || therapist.weightKg) && (
                      <span className="flex items-center gap-1.5">
                        <Ruler className="size-3.5 shrink-0" />
                        {therapist.heightCm ? `${therapist.heightCm} cm` : ""}
                        {therapist.heightCm && therapist.weightKg ? " · " : ""}
                        {therapist.weightKg ? `${therapist.weightKg} kg` : ""}
                      </span>
                    )}
                    {location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" />
                        {location}
                      </span>
                    )}
                    {therapist.languages && (
                      <span className="flex items-center gap-1.5">
                        <Languages className="size-3.5 shrink-0" />
                        {therapist.languages}
                      </span>
                    )}
                  </div>

                  {bio && <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{bio}</p>}

                  <Button
                    size="lg"
                    disabled={!therapist.available}
                    onClick={() => openBooking({ therapistId: therapist.id })}
                    className={`mt-auto h-9 min-w-24 whitespace-nowrap px-4 ${locale === "ko" ? "font-korean-sans text-sm" : "text-xs"} self-center rounded-full bg-accent font-semibold uppercase tracking-[0.06em] text-accent-foreground transition-transform duration-200 hover:-translate-y-0.5 hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground`}
                  >
                    {t.experts.book}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>

        {visibleCount < therapists.length && (
          <div className="mt-10 flex justify-center">
            <Button variant="outline" size="sm" className="px-4" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              {locale === "en" ? "Show more" : locale === "ko" ? "더보기" : "Xem thêm"}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
