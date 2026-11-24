"use client"

import { useState } from "react"
import { useBooking } from "@/lib/booking-context"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatVnd } from "@/lib/pricing"

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
    <div className="flex flex-col gap-3 sm:gap-6">
      <div>
        <h2 className="font-serif text-base sm:text-2xl">{t.booking.selectService}</h2>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {services.map((service) => {
          const name = pickLocalized({ en: service.nameEn, ko: service.nameKo, vi: service.nameVi }, locale)
          const isSelected = draft.serviceId === service.id
          return (
            <div key={service.id} className={cn("flex h-28 min-w-0 flex-col border p-2 transition-colors sm:h-40 sm:p-3", isSelected ? "border-primary bg-muted" : "border-border")}>
              <button type="button" onClick={() => { setError(false); updateDraft({ serviceId: service.id, durationMinutes: service.durations[0]?.minutes ?? null }) }} className="flex h-9 w-full min-w-0 items-start gap-1 text-left sm:gap-2 sm:h-10">
                <span className="text-base leading-4 sm:text-xl sm:leading-5" aria-hidden="true">{service.icon}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="line-clamp-2 text-[11px] font-medium leading-4 sm:text-sm sm:leading-5">{name}</span>
                </span>
              </button>
              <div className="mt-1 flex min-h-0 flex-1 justify-end sm:mt-2 sm:h-[5.75rem] sm:flex-none" aria-label={`${name} duration`}>
                <div className="flex min-w-0 flex-col items-start gap-0.5 sm:gap-1.5">
                  {[60, 90, 120].map((minutes) => {
                    const duration = service.durations.find((d) => d.minutes === minutes)
                    if (!duration) return null
                    const selected = draft.serviceId === service.id && draft.durationMinutes === minutes
                    return (
                      <button key={duration.id} type="button" onClick={() => { setError(false); updateDraft({ serviceId: service.id, durationMinutes: minutes }) }} className="flex items-center gap-1 text-sm sm:gap-1.5" aria-pressed={selected} aria-label={`${minutes} ${t.services.minutes}`}>
                        <span className={cn("grid size-3 shrink-0 place-items-center rounded-full border sm:size-4", selected ? "border-primary" : "border-muted-foreground/50")} aria-hidden="true">
                          {selected && <span className="size-1.5 rounded-full bg-primary sm:size-2" />}
                        </span>
                        <span className={cn("whitespace-nowrap text-[9px] leading-3 sm:text-[11px] sm:leading-4", selected ? "font-semibold text-foreground" : "text-muted-foreground")}>{minutes} {t.services.minutes} / {formatVnd(duration.priceVnd)}</span>
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

      <div className="flex justify-end border-t border-border pt-3 sm:pt-5">
        <Button onClick={handleContinue}>
          {t.booking.next}
        </Button>
      </div>
    </div>
  )
}
