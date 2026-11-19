"use client"

import { useState, useTransition } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { resendBookingManagementLink, updateBookingStatus } from "@/app/actions/admin"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending review" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const

const STATUS_STYLES: Record<string, string> = {
  pending: "text-amber-600",
  confirmed: "text-primary",
  completed: "text-emerald-600",
  cancelled: "text-destructive",
}

export function BookingStatusSelect({ bookingId, status }: { bookingId: number; status: string }) {
  const [isPending, startTransition] = useTransition()
  const [notice, setNotice] = useState("")

  return (
    <div className="flex flex-col items-start gap-1">
      <Select
        value={status}
        disabled={isPending}
        onValueChange={(value) => startTransition(async () => {
          setNotice("")
          try { await updateBookingStatus(bookingId, value as typeof STATUS_OPTIONS[number]["value"]) }
          catch { setNotice("Could not update. Refresh and check availability.") }
        })}
      >
      <SelectTrigger size="sm" className={cn("h-8 w-[130px]", STATUS_STYLES[status])}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
      </Select>
      {(status === "pending" || status === "confirmed") && <button type="button" disabled={isPending} className="min-h-8 text-sm font-medium text-primary underline underline-offset-4 disabled:opacity-50" onClick={() => startTransition(async () => {
        setNotice("")
        try { setNotice(await resendBookingManagementLink(bookingId) ? "Management link sent to booking email." : "Link could not be sent. Check the booking and email settings.") }
        catch { setNotice("Link could not be sent.") }
      })}>Resend booking link</button>}
      {notice && <p role="status" className="max-w-44 text-sm text-muted-foreground">{notice}</p>}
    </div>
  )
}
