'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

const statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]

export function BookingFilters({ therapists }: { therapists: Array<{ id: number; code: string }> }) {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(params.get("search") ?? "")

  function apply(next: Record<string, string>) {
    const query = new URLSearchParams(params.toString())
    Object.entries(next).forEach(([key, value]) => value ? query.set(key, value) : query.delete(key))
    query.delete("page")
    startTransition(() => router.push(`/admin/bookings?${query.toString()}`))
  }

  return (
    <form className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(event) => { event.preventDefault(); apply({ search }) }}>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, email, reference" className="h-9 rounded-md border border-input bg-background px-3 text-sm lg:col-span-2" />
      <select defaultValue={params.get("status") ?? ""} onChange={(event) => apply({ status: event.target.value })} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
        <option value="">All statuses</option>
        {statuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
      </select>
      <select defaultValue={params.get("therapistId") ?? ""} onChange={(event) => apply({ therapistId: event.target.value })} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
        <option value="">All therapists</option>
        {therapists.map((therapist) => <option key={therapist.id} value={therapist.id}>{therapist.code}</option>)}
      </select>
      <button type="submit" disabled={isPending} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">Search</button>
    </form>
  )
}
