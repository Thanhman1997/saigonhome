"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { markBookingPaid } from "@/app/actions/admin"

export function MarkPaidButton({ bookingId }: { bookingId: number }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await markBookingPaid(bookingId)
        if (!result.updated) setError("Could not mark as paid.")
      } catch {
        setError("Could not mark as paid.")
      }
    })
  }

  return (
    <div className="mt-2 flex flex-col gap-1">
      <Button type="button" size="sm" variant="outline" onClick={handleClick} disabled={pending}>
        {pending ? "Saving..." : "Mark as paid"}
      </Button>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
