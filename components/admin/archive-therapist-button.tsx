"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { archiveTherapist } from "@/app/actions/therapists"

export function ArchiveTherapistButton({ therapistId }: { therapistId: number }) {
  const [pending, startTransition] = useTransition()
  return <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => startTransition(() => archiveTherapist(therapistId))}>{pending ? "Archiving…" : "Archive"}</Button>
}
