import { getAllBookingsWithRelations, getAllTherapistsAdmin } from "@/lib/admin-data"
import { BookingFilters } from "@/components/admin/booking-filters"
import { formatVnd } from "@/lib/pricing"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookingStatusSelect } from "@/components/admin/booking-status-select"

export const metadata = { title: "Bookings" }

function formatDateTime(date: string, time: string) {
  const d = new Date(`${date}T00:00:00`)
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  return `${dateStr} · ${time}`
}

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const get = (key: string) => typeof params[key] === "string" ? params[key] : undefined
  const result = await getAllBookingsWithRelations({ search: get("search"), status: get("status"), therapistId: Number(get("therapistId")) || undefined, page: Number(get("page")) || 1 })
  const bookings = result.rows
  const therapists = await getAllTherapistsAdmin()
  const query = new URLSearchParams(Object.entries(params).flatMap(([key, value]) => value ? [[key, String(value)]] : []))
  const exportHref = `/admin/bookings/export?${query.toString()}`

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          {bookings.length} total booking{bookings.length === 1 ? "" : "s"}
        </p>
      </div>

      <BookingFilters therapists={therapists.map((therapist) => ({ id: therapist.id, code: therapist.code }))} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Showing page {result.page}</p>
        <div className="flex gap-2">
          <a href={exportHref} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Export CSV</a>
          {result.page > 1 && <a href={`/admin/bookings?page=${result.page - 1}`} className="rounded-md border border-border px-3 py-2 text-sm">Previous</a>}
          {result.hasNextPage && <a href={`/admin/bookings?page=${result.page + 1}`} className="rounded-md border border-border px-3 py-2 text-sm">Next</a>}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Therapist</TableHead>
              <TableHead>Date &amp; time</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{booking.reference}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{booking.customerName}</span>
                    <span className="text-xs text-muted-foreground">{booking.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{booking.service?.nameEn ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">{booking.durationMinutes} min</span>
                  </div>
                </TableCell>
                <TableCell>{booking.therapist?.code ?? "No preference"}</TableCell>
                <TableCell className="text-sm">{formatDateTime(booking.date, booking.time)}</TableCell>
                <TableCell>{booking.guests}</TableCell>
                <TableCell className="font-medium">{formatVnd(booking.totalVnd)}</TableCell>
                <TableCell>
                  <BookingStatusSelect bookingId={booking.id} status={booking.status} />
                </TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No bookings yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
