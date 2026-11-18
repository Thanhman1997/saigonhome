"use client"

import { useEffect, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/lib/booking-context"
import { useLanguage } from "@/lib/i18n/language-provider"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const VIETNAM_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})
const ONE_HOUR_MS = 60 * 60 * 1000
const SLOT_INTERVAL_MS = 15 * 60 * 1000

const TIME_SLOTS = Array.from({ length: 61 }, (_, index) => {
  const totalMinutes = 9 * 60 + index * 15
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
})

function getVietnamTimeParts(date: Date) {
  const values = Object.fromEntries(
    VIETNAM_TIME_FORMATTER.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  )
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  }
}

export function StepDateTime({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { draft, updateDraft } = useBooking()
  const { t } = useLanguage()
  const [now, setNow] = useState(() => new Date())
  const [error, setError] = useState<"selection" | "minimumNotice" | null>(null)

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const vietnamToday = getVietnamTimeParts(now).date
  const earliestSlot = new Date(Math.ceil((now.getTime() + ONE_HOUR_MS) / SLOT_INTERVAL_MS) * SLOT_INTERVAL_MS)
  const earliestVietnamTime = getVietnamTimeParts(earliestSlot)
  const selectedDate = draft.date ? new Date(draft.date + "T00:00:00") : undefined
  const today = new Date(`${vietnamToday}T00:00:00`)

  function isTimeAllowed(time: string) {
    if (!draft.date) return true
    if (draft.date > earliestVietnamTime.date) return true
    if (draft.date < earliestVietnamTime.date) return false
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes >= earliestVietnamTime.minutes
  }

  function handleContinue() {
    if (!draft.date || !draft.time) {
      setError("selection")
      return
    }
    if (!isTimeAllowed(draft.time)) {
      setError("minimumNotice")
      return
    }
    onNext()
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-serif text-2xl">{t.booking.steps.datetime}</h2>

      <div className="flex flex-col gap-3">
        <div className="mx-auto flex w-fit justify-center overflow-hidden border border-border sm:justify-center [&_.rdp-root]:p-0 [&_.rdp-root]:[--cell-size:1.75rem]">
          <Calendar
            mode="single"
            showOutsideDays={false}
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                const localDate = [
                  date.getFullYear(),
                  String(date.getMonth() + 1).padStart(2, "0"),
                  String(date.getDate()).padStart(2, "0"),
                ].join("-")
                setError(null)
                updateDraft({ date: localDate, time: null })
              }
            }}
            disabled={{ before: today }}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-sm font-medium">{t.booking.selectTime}</p>
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{t.booking.minimumNotice}</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-7">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  type="button"
                  disabled={!isTimeAllowed(time)}
                  onClick={() => {
                    setError(null)
                    updateDraft({ time })
                  }}
                  className={cn(
                    "flex h-9 w-14 items-center justify-center border p-0 font-sans text-sm font-medium leading-none tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-40",
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

      {error && (
        <p className="text-sm text-destructive">
          {error === "minimumNotice" ? t.booking.minimumNotice : t.booking.selectDateTimeFirst}
        </p>
      )}

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
