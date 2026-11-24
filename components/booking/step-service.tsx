"use client"

import { useState } from "react"
import { useBooking } from "@/lib/booking-context"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatVnd } from "@/lib/pricing"
import { ServiceIcon } from "./service-icon"

export function StepService({ onNext }: { onNext: () => void }) {
  const { services, draft, updateDraft } = useBooking()
  const { t, locale } = useLanguage()
  const [error, setError] = useState(false)


  function handleContinue() {
    if (!draft.serviceId || !draft.durationMinutes) {
      setError(true)
      return
    }
    onNext()
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-2 sm:gap-2 lg:gap-6">
      <div>
        <h2 className="font-serif text-base sm:text-lg lg:text-2xl">{t.booking.selectService}</h2>
      </div>

      <div className="grid min-h-0 w-full min-w-0 flex-1 grid-cols-3 auto-rows-fr gap-2 sm:gap-1 lg:gap-3">
        {services.map((service) => {
          const name = pickLocalized({ en: service.nameEn, ko: service.nameKo, vi: service.nameVi }, locale)
          const isSelected = draft.serviceId === service.id
          return (
            <div key={service.id} className={cn("flex h-full min-h-28 min-w-0 flex-col border p-1 transition-colors sm:p-1 lg:p-2", isSelected ? "border-primary bg-muted" : "border-border")}>
              <button type="button" onClick={() => { setError(false); updateDraft({ serviceId: service.id, durationMinutes: service.durations[0]?.minutes ?? null }) }} className="flex h-6 w-full min-w-0 items-center gap-1 text-left sm:gap-1 sm:h-6 lg:gap-2 lg:h-8">
                <ServiceIcon slug={service.slug} icon={service.icon} />
                <span className="flex min-w-0 flex-col">
                  <span className="line-clamp-2 text-[10px] font-medium leading-3 sm:text-[10px] sm:leading-3 lg:text-xs lg:leading-4">{name}</span>
                </span>
              </button>
              <div className="mt-0.5 flex min-h-0 flex-1 justify-end" aria-label={`${name} duration`}>
                <div className="flex min-w-0 flex-col items-start gap-0 lg:gap-1">
                  {[60, 90, 120].map((minutes) => {
                    const duration = service.durations.find((d) => d.minutes === minutes)
                    if (!duration) return null
                    const selected = draft.serviceId === service.id && draft.durationMinutes === minutes
                    return (
                      <button key={duration.id} type="button" onClick={() => { setError(false); updateDraft({ serviceId: service.id, durationMinutes: minutes }) }} className="flex min-h-6 min-w-0 items-center gap-1 text-[10px] leading-3 lg:gap-1.5 lg:text-[11px]" aria-pressed={selected} aria-label={`${minutes} ${t.services.minutes}`}>
                        <span className={cn("grid size-3 shrink-0 place-items-center rounded-full border sm:size-4", selected ? "border-primary" : "border-muted-foreground/50")} aria-hidden="true">
                          {selected && <span className="size-1.5 rounded-full bg-primary sm:size-2" />}
                        </span>
                        <span className={cn("min-w-0 whitespace-normal break-words text-[10px] leading-3 lg:whitespace-nowrap lg:text-[11px] lg:leading-4", selected ? "font-semibold text-foreground" : "text-muted-foreground")}>{minutes} {t.services.minutes} / {formatVnd(duration.priceVnd)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>


      {error && <p className="text-sm text-destructive">{t.booking.selectServiceFirst}</p>}

      <div className="flex justify-center border-t border-border pt-1 lg:pt-5">
        <Button onClick={handleContinue}>
          {t.booking.next}
        </Button>
      </div>
    </div>
  )
}
