"use client"

import { useState, useTransition } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { resendBookingManagementLink, resendBookingReviewInvitation, revokeBookingManagementLink, updateBookingStatus } from "@/app/actions/admin"
import { allowedBookingStatuses } from "@/lib/booking-status"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending review" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
] as const

const STATUS_STYLES: Record<string, string> = {
  pending: "text-amber-600",
  confirmed: "text-primary",
  completed: "text-emerald-600",
  cancelled: "text-destructive",
  rejected: "text-destructive",
}

export function BookingStatusSelect({ bookingId, status, revoked }: { bookingId: number; status: string; revoked: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [notice, setNotice] = useState("")

  return (
    <div className="flex flex-col items-start gap-1">
      <Select
        value={status}
        disabled={isPending}
        onValueChange={(value) => startTransition(async () => {
          setNotice("")
          try {
            const { reviewEmailSent } = await updateBookingStatus(bookingId, value as typeof STATUS_OPTIONS[number]["value"])
            if (reviewEmailSent === true) setNotice("Booking completed. Review email accepted for delivery.")
            if (reviewEmailSent === false) setNotice("Booking completed, but the review email could not be sent. Use Resend review invitation to try again.")
          } catch { setNotice("Could not update. Refresh and check availability.") }
        })}
      >
      <SelectTrigger size="sm" aria-label="Booking status" className={cn("h-8 w-36 max-w-full", STATUS_STYLES[status])}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.filter((option) => allowedBookingStatuses(status).includes(option.value)).map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
      </Select>
      {(status === "pending" || status === "confirmed") && <button type="button" disabled={isPending} className="min-h-8 max-w-full text-left text-sm font-medium text-primary underline underline-offset-4 disabled:opacity-50" onClick={() => startTransition(async () => {
        setNotice("")
        try { setNotice(await resendBookingManagementLink(bookingId) ? "Management link sent to booking email." : "Link could not be sent. Check the booking and email settings.") }
        catch { setNotice("Link could not be sent.") }
      })}>Resend booking link</button>}
      {status === "completed" && <button type="button" disabled={isPending} className="min-h-8 max-w-full text-left text-sm font-medium text-primary underline underline-offset-4 disabled:opacity-50" onClick={() => {
        if (!window.confirm("Send another review invitation to the email on this booking?")) return
        startTransition(async () => {
          setNotice("")
          try {
            const accepted = await resendBookingReviewInvitation(bookingId)
            setNotice(accepted ? "Review email accepted for delivery." : "Review email could not be sent. Check the booking and email settings.")
          } catch { setNotice("Review email could not be sent.") }
        })
      }}>Resend review invitation</button>}
      {revoked ? <span className="text-sm text-muted-foreground">Link revoked</span> : <button type="button" disabled={isPending} className="min-h-8 max-w-full text-left text-sm text-destructive underline underline-offset-4 disabled:opacity-50" onClick={() => {
        if (!window.confirm("Revoke this guest’s booking link?")) return
        startTransition(async () => {
          try { await revokeBookingManagementLink(bookingId); setNotice("Management link revoked.") }
          catch { setNotice("Link could not be revoked.") }
        })
      }}>Revoke link</button>}
      {notice && <p role="status" className="max-w-44 text-sm text-muted-foreground">{notice}</p>}
    </div>
  )
}
