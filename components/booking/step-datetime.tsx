"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/lib/booking-context"
import { useLanguage } from "@/lib/i18n/language-provider"
import { getAvailableBookingTimes } from "@/app/actions/booking-availability"
import { MIN_BOOKING_NOTICE_MS } from "@/lib/booking-rules"
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
const SLOT_INTERVAL_MS = 15 * 60 * 1000

type BookingSlotKey = readonly ["booking-slots", number, number, number | null, number, string]

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
  const { draft, updateDraft, maxGuests } = useBooking()
  const { t } = useLanguage()
  const [now, setNow] = useState(() => new Date())
  const [error, setError] = useState<"selection" | "slotUnavailable" | null>(null)

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const availabilityKey: BookingSlotKey | null = draft.serviceId !== null && draft.durationMinutes !== null && draft.date
    ? ["booking-slots", draft.serviceId, draft.durationMinutes, draft.therapistId, draft.guests, draft.date]
    : null
  const { data: availability, error: availabilityRequestError, isLoading: availabilityLoading, mutate: refreshAvailability } = useSWR(
    availabilityKey,
    ([, serviceId, durationMinutes, therapistId, guests, date]) => getAvailableBookingTimes({ serviceId, durationMinutes, therapistId, guests, date }),
    { refreshInterval: 30_000, revalidateOnFocus: true },
  )
  const availabilityFailed = Boolean(availabilityRequestError || (availability && !availability.ok))
  const guestLimit = Math.min(maxGuests, availability?.ok ? availability.maxGuests : maxGuests)
  const vietnamToday = getVietnamTimeParts(now).date
  const earliestSlot = new Date(Math.ceil((now.getTime() + MIN_BOOKING_NOTICE_MS) / SLOT_INTERVAL_MS) * SLOT_INTERVAL_MS)
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

  const availableTimes = availability?.ok ? availability.times.filter(isTimeAllowed) : []

  function handleContinue() {
    if (!draft.date || !draft.time) {
      setError("selection")
      return
    }
    if (!isTimeAllowed(draft.time)) {
      updateDraft({ time: null })
      setError("slotUnavailable")
      return
    }
    if (availabilityLoading || !availability?.ok) return
    if (!availableTimes.includes(draft.time)) {
      updateDraft({ time: null })
      setError("slotUnavailable")
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
            {!draft.date && <p role="status" className="text-sm text-muted-foreground">{t.booking.selectDateForTimes}</p>}
            {draft.date && availabilityLoading && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{t.booking.checkingAvailability}</p>}
            {draft.date && !availabilityLoading && availabilityFailed && (
              <p role="alert" className="text-sm text-destructive">
                {t.booking.availabilityError}{" "}
                <button type="button" onClick={() => void refreshAvailability()} className="font-medium underline underline-offset-4">
                  {t.booking.retry}
                </button>
              </p>
            )}
            {draft.date && !availabilityLoading && !availabilityFailed && availableTimes.length === 0 && (
              <p role="status" className="text-sm text-muted-foreground">{t.booking.noAvailableTimes}</p>
            )}
            {availableTimes.length > 0 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-7">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      setError(null)
                      updateDraft({ time })
                    }}
                    className={cn(
                      "flex h-9 w-14 items-center justify-center border p-0 font-sans text-sm font-medium leading-none tabular-nums transition-colors",
                      draft.time === time
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">{t.booking.guests}</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => { setError(null); updateDraft({ guests: Math.max(1, draft.guests - 1), time: null }) }}
                className="flex size-10 items-center justify-center border border-border hover:border-primary/50"
                aria-label="Decrease guests"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-lg font-medium">{draft.guests}</span>
              <button
                type="button"
                disabled={draft.guests >= guestLimit}
                onClick={() => { setError(null); updateDraft({ guests: Math.min(guestLimit, draft.guests + 1), time: null }) }}
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
          {error === "slotUnavailable" ? t.booking.slotUnavailable : t.booking.selectDateTimeFirst}
        </p>
      )}

      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-background py-3">
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
