"use client"

import { useActionState } from "react"
import { syncVietnamHolidays, type HolidaySyncState } from "@/app/actions/holidays"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function HolidaySyncForm({ year }: { year: number }) {
  const [state, action, pending] = useActionState<HolidaySyncState, FormData>(syncVietnamHolidays, {})
  return <form action={action} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
    <div className="flex flex-col gap-2"><Label htmlFor="holiday-year">Year</Label><Input id="holiday-year" name="year" type="number" defaultValue={year} min={2020} max={2100} className="w-32" /></div>
    <Button type="submit" disabled={pending}>{pending ? "Syncing…" : "Sync from Nager.Date"}</Button>
    {state?.error && <p className="basis-full text-sm text-destructive">{state.error}</p>}
    {state?.count !== undefined && <p className="basis-full text-sm text-muted-foreground">Synced {state.count} holidays. Please verify dates before using them for promotions.</p>}
  </form>
}
