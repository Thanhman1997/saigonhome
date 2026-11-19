"use client"

import { useState, useTransition } from "react"
import { approveBookingChange, declineBookingChange } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"

type Request = { kind: "cancel" } | { kind: "reschedule"; label: string }

export function BookingChangeRequest({ bookingId, request }: { bookingId: number; request: Request }) {
  const [isPending, startTransition] = useTransition()
  const [notice, setNotice] = useState("")

  return (
    <div className="mt-3 flex flex-col items-start gap-2 rounded-md border border-border bg-muted p-3">
      <p className="text-sm font-semibold text-amber-600">Customer request awaiting your confirmation</p>
      <p className="text-sm text-foreground">{request.kind === "cancel" ? "Cancel this booking" : `Move to ${request.label}`}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            setNotice("")
            try {
              const { emailed } = await approveBookingChange(bookingId)
              setNotice(emailed ? "Confirmed. The customer was emailed." : "Confirmed, but the customer email could not be sent.")
            } catch (error) {
              setNotice(error instanceof Error && error.message.includes("no longer available") ? "That time is no longer available. Decline and contact the customer." : "Could not confirm. Refresh and try again.")
            }
          })}
        >
          Confirm change
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            setNotice("")
            try {
              await declineBookingChange(bookingId)
            } catch {
              setNotice("Could not decline. Refresh and try again.")
            }
          })}
        >
          Decline
        </Button>
      </div>
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    </div>
  )
}
