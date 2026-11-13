"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Unhandled admin error:", error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/40 px-6 text-center">
      <h1 className="font-sans text-2xl font-semibold text-foreground">Admin panel error</h1>
      <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
        Something failed while loading this admin page. You can retry, or go back to the dashboard.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" asChild>
          <a href="/admin/dashboard">Go to dashboard</a>
        </Button>
      </div>
    </div>
  )
}
