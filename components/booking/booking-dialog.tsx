"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
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
  const [bookingResult, setBookingResult] = useState<import("@/app/actions/booking").BookingReceipt | null>(null)

  const step = STEP_KEYS[stepIndex]
  // The dialog content mounts in a portal after the first render, so track the element in state.
  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null)
  const [serviceStepHeight, setServiceStepHeight] = useState<number | null>(null)

  // Record the natural height of the service step so the therapist step can match it exactly.
  useEffect(() => {
    if (step !== "service" || !contentEl) return
    const measure = () => setServiceStepHeight(contentEl.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(contentEl)
    return () => observer.disconnect()
  }, [step, contentEl])

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
      <DialogContent ref={setContentEl} style={step === "therapist" && serviceStepHeight ? { minHeight: serviceStepHeight } : undefined} className="max-h-[calc(100dvh-0.5rem)] w-screen min-w-0 min-h-0 max-w-6xl overflow-x-hidden overflow-y-auto p-0 sm:max-h-[calc(100dvh-1rem)]" showCloseButton>
        <DialogTitle className="sr-only">{t.booking.title}</DialogTitle>
        <DialogDescription className="sr-only">
          {t.booking.step} {stepIndex + 1} {t.booking.of} {STEP_KEYS.length}
        </DialogDescription>
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="border-b border-border px-4 py-3 sm:px-4 sm:py-2 lg:px-6 lg:py-5">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <Image
                src="/images/lotus-round-logo.png"
                alt="Lotus Wellness"
                width={64}
                height={64}
                className="size-10 shrink-0 rounded-full object-contain sm:size-10 md:size-12 lg:size-14"
              />
              <p className="min-w-0 flex-1 whitespace-nowrap pr-9 text-right text-[10px] font-semibold uppercase leading-none tracking-[0.04em] text-accent sm:pr-5 sm:text-xs sm:tracking-[0.06em] md:text-sm lg:text-base">
                {t.booking.title}
              </p>
            </div>
            {step !== "confirm" && (
              <div className="mt-3 flex items-center gap-1.5 sm:mt-2 sm:gap-1.5 lg:mt-4 lg:gap-2">
                {STEP_KEYS.slice(0, 4).map((key, idx) => (
                  <div key={key} className="flex flex-1 items-center gap-2">
                    <div
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium sm:size-5 sm:text-[10px] lg:size-6 lg:text-xs",
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

          <div className="flex min-h-0 min-w-0 flex-1 flex-col px-1 py-0 sm:px-2 sm:py-0 lg:px-6 lg:py-4">
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
