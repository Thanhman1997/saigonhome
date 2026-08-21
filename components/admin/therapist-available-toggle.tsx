"use client"

import { useTransition } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toggleTherapistAvailable } from "@/app/actions/therapists"

export function TherapistAvailableToggle({ therapistId, available }: { therapistId: number; available: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`therapist-${therapistId}`}
        checked={available}
        disabled={isPending}
        onCheckedChange={(checked) => startTransition(() => toggleTherapistAvailable(therapistId, checked))}
      />
      <Label htmlFor={`therapist-${therapistId}`} className="text-xs text-muted-foreground">
        {available ? "Available" : "Unavailable"}
      </Label>
    </div>
  )
}
