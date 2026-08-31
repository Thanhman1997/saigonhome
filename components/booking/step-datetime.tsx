"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/lib/booking-context"
import { useLanguage } from "@/lib/i18n/language-provider"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// Booking is available from 09:00 through 24:00 in 15-minute intervals.
const TIME_SLOTS = Array.from({ length: 61 }, (_, index) => {
  const totalMinutes = 9 * 60 + index * 15
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
})

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
    <div className="flex flex-col gap-3">
      <h2 className="font-serif text-2xl">{t.booking.steps.datetime}</h2>

      <div className="flex flex-col gap-3">
        <div className="flex justify-center overflow-hidden border border-border sm:justify-center [&_.rdp-root]:p-1 [&_.rdp-root]:[--cell-size:2.25rem]">
          <Calendar
            mode="single"
            showOutsideDays={false}
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
            <p className="mb-2 text-sm font-medium">{t.booking.selectTime}</p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    setError(false)
                    updateDraft({ time })
                  }}
                  className={cn(
                    "aspect-square size-14 border p-1 text-sm font-medium leading-5 transition-colors",
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
            <p className="mb-2 text-sm font-medium">{t.booking.guests}</p>
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

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
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
