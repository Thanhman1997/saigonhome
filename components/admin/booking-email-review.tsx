"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  approveBookingChangeFromEmail,
  confirmBookingWithOneTimeToken,
  declineBookingChangeFromEmail,
  rejectBookingWithOneTimeToken,
  updateBookingStatus,
} from "@/app/actions/admin"
import { Button } from "@/components/ui/button"

type Props = {
  bookingId: number
  tokens: { confirm: string; decline: string }
  oneTimeToken?: string
  isAdmin: boolean
  mode: "new" | "change"
  confirmLabel: string
}

export function BookingEmailReview({ bookingId, tokens, oneTimeToken, isAdmin, mode, confirmLabel }: Props) {
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
        setNotice(error instanceof Error && error.message.includes("no longer available") ? "That time is no longer available. Review the booking and contact the customer." : failure)
      }
    })

  const confirm = async () => {
    if (mode === "change") {
      const { emailed } = await approveBookingChangeFromEmail(bookingId, tokens.confirm)
      return emailed ? "Change approved. The customer was emailed." : "Change approved, but the customer email could not be sent."
    }
    if (oneTimeToken) {
      const result = await confirmBookingWithOneTimeToken(bookingId, oneTimeToken)
      if (!result.ok) throw new Error("This confirmation link is invalid or expired")
      return result.customerNotificationSent ? "Booking confirmed. Resend accepted the customer notification." : "Booking confirmed, but Resend did not accept the customer email."
    }
    if (isAdmin) {
      await updateBookingStatus(bookingId, "confirmed")
      return "Booking confirmed."
    }
    throw new Error("This confirmation link is invalid or expired")
  }

  const reject = async () => {
    if (mode === "change") {
      await declineBookingChangeFromEmail(bookingId, tokens.decline)
      return "Request declined. The booking stays unchanged."
    }
    if (oneTimeToken) {
      const result = await rejectBookingWithOneTimeToken(bookingId, oneTimeToken)
      if (!result.ok) throw new Error("This rejection link is invalid or expired")
      return result.customerNotificationSent ? "Booking rejected. Resend accepted the customer notification." : "Booking rejected, but Resend did not accept the customer email."
    }
    if (isAdmin) {
      await updateBookingStatus(bookingId, "rejected")
      return "Booking rejected."
    }
    throw new Error("This rejection link is invalid or expired")
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={isPending} onClick={() => run(confirm, "Could not confirm. Refresh and try again.")}>
          {confirmLabel}
        </Button>
        {(mode === "new" || mode === "change") && (
          <Button type="button" variant="destructive" disabled={isPending} onClick={() => run(reject, "Could not reject. Refresh and try again.")}>
            {mode === "new" ? "Reject booking" : "Decline"}
          </Button>
        )}
      </div>
      {notice && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{notice}</p>}
    </div>
  )
}
