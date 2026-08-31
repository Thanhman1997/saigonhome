"use client"

import Image from "next/image"
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useBooking } from "@/lib/booking-context"
import { useLanguage } from "@/lib/i18n/language-provider"
import { StepService } from "./step-service"
import { StepTherapist } from "./step-therapist"
import { StepDateTime } from "./step-datetime"
import { StepDetails } from "./step-details"
import { StepConfirm } from "./step-confirm"
import { cn } from "@/lib/utils"

const STEP_KEYS = ["service", "therapist", "datetime", "details", "confirm"] as const
export type StepKey = (typeof STEP_KEYS)[number]

export function BookingDialog() {
  const { isOpen, closeBooking, resetDraft } = useBooking()
  const { t } = useLanguage()
  const [stepIndex, setStepIndex] = useState(0)
  const [customerInfo, setCustomerInfo] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    detailedAddress: "",
    notes: "",
  })
  const [bookingResult, setBookingResult] = useState<{ reference: string; totalVnd: number; subtotalVnd: number; discountVnd: number } | null>(null)

  const step = STEP_KEYS[stepIndex]

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1))
  }
  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  function handleClose(open: boolean) {
    if (!open) {
      closeBooking()
      setStepIndex(0)
      setBookingResult(null)
      setCustomerInfo({ customerName: "", email: "", phone: "", address: "", detailedAddress: "", notes: "" })
      resetDraft()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[98vh] max-w-6xl overflow-y-auto p-0" showCloseButton>
        <DialogTitle className="sr-only">{t.booking.title}</DialogTitle>
        <DialogDescription className="sr-only">
          {t.booking.step} {stepIndex + 1} {t.booking.of} {STEP_KEYS.length}
        </DialogDescription>
        <div className="flex flex-col">
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-center justify-between gap-4"><Image src="/images/lotus-round-logo.png" alt="Lotus Wellness" width={72} height={72} className="size-16 rounded-full object-contain" /><p className="text-right text-sm font-semibold uppercase tracking-[0.2em] text-accent">{t.booking.title}</p></div>
            {step !== "confirm" && (
              <div className="mt-4 flex items-center gap-2">
                {STEP_KEYS.slice(0, 4).map((key, idx) => (
                  <div key={key} className="flex flex-1 items-center gap-2">
                    <div
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                        idx <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {idx + 1}
                    </div>
                    {idx < 3 && (
                      <div className={cn("h-px flex-1", idx < stepIndex ? "bg-primary" : "bg-border")} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-6">
            {step === "service" && <StepService onNext={goNext} />}
            {step === "therapist" && <StepTherapist onNext={goNext} onBack={goBack} />}
            {step === "datetime" && <StepDateTime onNext={goNext} onBack={goBack} />}
            {step === "details" && (
              <StepDetails
                customerInfo={customerInfo}
                setCustomerInfo={setCustomerInfo}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {step === "confirm" && (
              <StepConfirm
                customerInfo={customerInfo}
                onBack={goBack}
                bookingResult={bookingResult}
                setBookingResult={setBookingResult}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
