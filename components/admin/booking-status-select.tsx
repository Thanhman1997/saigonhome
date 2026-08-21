"use client"

import { useTransition } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateBookingStatus } from "@/app/actions/admin"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No-show" },
] as const

type BookingStatus = (typeof STATUS_OPTIONS)[number]["value"]

const STATUS_STYLES: Record<string, string> = {
  pending: "text-amber-600",
  confirmed: "text-primary",
  in_progress: "text-blue-600",
  completed: "text-emerald-600",
  cancelled: "text-destructive",
  no_show: "text-muted-foreground",
}

export function BookingStatusSelect({ bookingId, status }: { bookingId: number; status: string }) {
  const [isPending, startTransition] = useTransition()
  const options = STATUS_OPTIONS.filter((option) => {
    const allowed: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["in_progress", "cancelled"],
      in_progress: ["completed", "no_show", "cancelled"],
    }
    return option.value === status || allowed[status]?.includes(option.value)
  })

  return (
    <Select
      value={status}
      disabled={isPending || !options.some((option) => option.value !== status)}
      onValueChange={(value) => startTransition(() => updateBookingStatus(bookingId, value as BookingStatus))}
    >
      <SelectTrigger size="sm" className={cn("h-8 w-[130px]", STATUS_STYLES[status])}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
