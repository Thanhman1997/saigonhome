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

  const selectedService = services.find((s) => s.id === draft.serviceId)

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

      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((service) => {
          const name = pickLocalized({ en: service.nameEn, ko: service.nameKo, vi: service.nameVi }, locale)
          const isSelected = draft.serviceId === service.id
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => {
                setError(false)
                updateDraft({ serviceId: service.id, durationMinutes: service.durations[0]?.minutes ?? null })
              }}
              className={cn(
                "flex items-start gap-3 border p-4 text-left transition-colors",
                isSelected ? "border-primary bg-muted" : "border-border hover:border-primary/50",
              )}
            >
              <span className="text-2xl" aria-hidden="true">
                {service.icon}
              </span>
              <span className="flex flex-col">
                <span className="font-medium">{name}</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {t.services.from} {formatVnd(Math.min(...service.durations.map((d) => d.priceVnd)))}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {selectedService && selectedService.durations.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium">{t.booking.selectDuration}</p>
          <div className="flex flex-col gap-2">
            {selectedService.durations.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => updateDraft({ durationMinutes: d.minutes })}
                className={cn(
                  "flex flex-col gap-1 border px-4 py-3 text-left text-sm transition-colors sm:flex-row sm:items-center sm:justify-between",
                  draft.durationMinutes === d.minutes
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/50",
                )}
              >
                <span className="font-medium">{d.minutes} {t.services.minutes}</span>
                <span>{formatVnd(d.priceVnd)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{t.booking.selectServiceFirst}</p>}

      <div className="flex justify-end border-t border-border pt-5">
        <Button onClick={handleContinue} size="lg">
          {t.booking.next}
        </Button>
      </div>
    </div>
  )
}
