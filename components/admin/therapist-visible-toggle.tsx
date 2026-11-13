"use client"

import { useTransition } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toggleTherapistVisible } from "@/app/actions/therapists"

export function TherapistVisibleToggle({ therapistId, visible }: { therapistId: number; visible: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`therapist-visible-${therapistId}`}
        checked={visible}
        disabled={isPending}
        onCheckedChange={(checked) => startTransition(() => toggleTherapistVisible(therapistId, checked))}
      />
      <Label htmlFor={`therapist-visible-${therapistId}`} className="text-xs text-foreground">
        {visible ? "Đang hiển thị" : "Đang ẩn"}
      </Label>
    </div>
  )
}
