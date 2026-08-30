"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/lib/booking-context"
import { useLanguage } from "@/lib/i18n/language-provider"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// The booking settings default to 09:00–21:00. The closing time itself is not bookable.
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
]

export function StepDateTime({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { draft, updateDraft } = useBooking()
  const { t } = useLanguage()
  const [error, setError] = useState(false)

  const selectedDate = draft.date ? new Date(draft.date + "T00:00:00") : undefined
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function handleContinue() {
    if (!draft.date || !draft.time) {
      setError(true)
      return
    }
    onNext()
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif text-2xl">{t.booking.steps.datetime}</h2>

      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="flex justify-center border border-border sm:justify-start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setError(false)
                const localDate = [
                  date.getFullYear(),
                  String(date.getMonth() + 1).padStart(2, "0"),
                  String(date.getDate()).padStart(2, "0"),
                ].join("-")
                updateDraft({ date: localDate })
              }
            }}
            disabled={{ before: today }}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-3 text-sm font-medium">{t.booking.selectTime}</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-3">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    setError(false)
                    updateDraft({ time })
                  }}
                  className={cn(
                    "border px-2 py-2 text-xs font-medium transition-colors sm:text-sm",
                    draft.time === time
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">{t.booking.guests}</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => updateDraft({ guests: Math.max(1, draft.guests - 1) })}
                className="flex size-10 items-center justify-center border border-border hover:border-primary/50"
                aria-label="Decrease guests"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-lg font-medium">{draft.guests}</span>
              <button
                type="button"
                onClick={() => updateDraft({ guests: Math.min(20, draft.guests + 1) })}
                className="flex size-10 items-center justify-center border border-border hover:border-primary/50"
                aria-label="Increase guests"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{t.booking.selectDateTimeFirst}</p>}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button variant="outline" onClick={onBack} size="lg">
          {t.booking.back}
        </Button>
        <Button onClick={handleContinue} size="lg">
          {t.booking.next}
        </Button>
      </div>
    </div>
  )
}
