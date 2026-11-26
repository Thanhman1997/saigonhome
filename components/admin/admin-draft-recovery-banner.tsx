"use client"

import { Button } from "@/components/ui/button"

function formatSavedAt(value: string | null) {
  if (!value) return "just now"
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  return minutes < 1 ? "just now" : `${minutes} minute${minutes === 1 ? "" : "s"} ago`
}

export function AdminDraftRecoveryBanner({ savedAt, onDiscard }: { savedAt: string | null; onDiscard: () => void }) {
  if (!savedAt) return null
  return <div className="flex flex-col gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between" role="status">
    <span><span className="font-medium">Draft restored automatically</span><span className="ml-2 text-muted-foreground">Saved {formatSavedAt(savedAt)}</span></span>
    <Button type="button" variant="ghost" size="sm" onClick={onDiscard}>Discard draft</Button>
  </div>
}
