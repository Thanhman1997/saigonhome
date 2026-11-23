"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { approveBookingChangeFromEmail, confirmBookingFromEmail, declineBookingChangeFromEmail } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"

type Props = { bookingId: number; tokens: { confirm: string; decline: string }; mode: "new" | "change"; confirmLabel: string }

export function BookingEmailReview({ bookingId, tokens, mode, confirmLabel }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notice, setNotice] = useState("")

  const run = (task: () => Promise<string>, failure: string) =>
    startTransition(async () => {
      setNotice("")
      try {
        setNotice(await task())
        router.refresh()
      } catch (error) {
        setNotice(error instanceof Error && error.message.includes("no longer available") ? "That time is no longer available. Decline and contact the customer." : failure)
      }
    })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => run(async () => {
            if (mode === "new") {
              await confirmBookingFromEmail(bookingId, tokens.confirm)
              return "Booking confirmed. The customer was emailed."
            }
            const { emailed } = await approveBookingChangeFromEmail(bookingId, tokens.confirm)
            return emailed ? "Confirmed. The customer was emailed." : "Confirmed, but the customer email could not be sent."
          }, "Could not confirm. Refresh and try again.")}
        >
          {confirmLabel}
        </Button>
        {mode === "change" && (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => run(async () => {
              await declineBookingChangeFromEmail(bookingId, tokens.decline)
              return "Request declined. The booking stays unchanged."
            }, "Could not decline. Refresh and try again.")}
          >
            Decline
          </Button>
        )}
      </div>
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    </div>
  )
}
