"use client"

import { useState } from "react"
import { useBooking } from "@/lib/booking-context"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { formatVnd } from "@/lib/pricing"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-2xl">{t.booking.selectService}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const name = pickLocalized({ en: service.nameEn, ko: service.nameKo, vi: service.nameVi }, locale)
          const isSelected = draft.serviceId === service.id
          return (
            <div key={service.id} className={cn("border p-4 transition-colors", isSelected ? "border-primary bg-muted" : "border-border")}>
              <button type="button" onClick={() => { setError(false); updateDraft({ serviceId: service.id, durationMinutes: service.durations[0]?.minutes ?? null }) }} className="flex w-full items-start gap-3 text-left">
                <span className="text-2xl" aria-hidden="true">{service.icon}</span>
                <span className="flex flex-col">
                  <span className="font-medium">{name}</span>
                  <span className="mt-1 text-xs text-muted-foreground">{t.services.from} {formatVnd(Math.min(...service.durations.map((d) => d.priceVnd)))}</span>
                </span>
              </button>
              <div className="mt-3 flex items-center justify-between gap-3" aria-label={`${name} duration`}>
                <span className="text-xs text-muted-foreground">{t.booking.selectDuration}</span>
                <div className="flex flex-col items-end gap-1.5">
                  {[60, 90, 120].map((minutes) => {
                    const duration = service.durations.find((d) => d.minutes === minutes)
                    if (!duration) return null
                    const selected = draft.serviceId === service.id && draft.durationMinutes === minutes
                    return <button key={duration.id} type="button" onClick={() => { setError(false); updateDraft({ serviceId: service.id, durationMinutes: minutes }) }} className={cn("flex size-9 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold leading-none transition-colors", selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary/50")} aria-pressed={selected} aria-label={`${minutes} ${t.services.minutes}`}>{minutes}</button>
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>


      {error && <p className="text-sm text-destructive">{t.booking.selectServiceFirst}</p>}

      <div className="flex justify-end border-t border-border pt-5">
        <Button onClick={handleContinue} size="lg">
          {t.booking.next}
        </Button>
      </div>
    </div>
  )
}
