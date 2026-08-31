"use client"

import { useTransition } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateBookingStatus } from "@/app/actions/admin"
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

  return (
    <Select
      value={status}
      disabled={isPending}
      onValueChange={(value) => startTransition(() => updateBookingStatus(bookingId, value as "pending" | "confirmed" | "completed" | "cancelled"))}
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
  )
}
