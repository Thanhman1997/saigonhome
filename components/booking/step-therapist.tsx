"use client"

import Image from "next/image"
import { Users } from "lucide-react"
import { useBooking } from "@/lib/booking-context"
import { useLanguage } from "@/lib/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function StepTherapist({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { therapists, draft, updateDraft } = useBooking()
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif text-2xl">{t.booking.selectTherapist}</h2>

      <button
        type="button"
        onClick={() => updateDraft({ therapistId: null })}
        className={cn(
          "flex items-center gap-3 border p-4 text-left transition-colors",
          draft.therapistId === null ? "border-primary bg-muted" : "border-border hover:border-primary/50",
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Users className="size-5" />
        </span>
        <span className="text-sm font-medium">{t.booking.anyTherapist}</span>
      </button>

      <div className="grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {therapists.map((therapist) => {
          const isSelected = draft.therapistId === therapist.id
          return (
            <button
              key={therapist.id}
              type="button"
              disabled={!therapist.available}
              onClick={() => updateDraft({ therapistId: therapist.id })}
              className={cn(
                "flex items-center gap-3 border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                isSelected ? "border-primary bg-muted" : "border-border hover:border-primary/50",
              )}
            >
              <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-muted">
                <Image
                  src={therapist.photoUrl || "/images/therapist-placeholder.png"}
                  alt=""
                  fill
                  className="object-cover"
                />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium">{therapist.code}</span>
                {therapist.experienceYears && (
                  <span className="text-xs text-muted-foreground">
                    {therapist.experienceYears} {t.experts.years}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button variant="outline" onClick={onBack} size="lg">
          {t.booking.back}
        </Button>
        <Button onClick={onNext} size="lg">
          {t.booking.next}
        </Button>
      </div>
    </div>
  )
}
