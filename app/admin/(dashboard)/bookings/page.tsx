import { getAllBookingsWithRelations } from "@/lib/admin-data"
import { formatVnd } from "@/lib/pricing"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookingStatusSelect } from "@/components/admin/booking-status-select"
import { BookingChangeRequest } from "@/components/admin/booking-change-request"
import { pendingChangeRequest } from "@/lib/booking-change-request"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export const metadata = { title: "Bookings" }

function BookingField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <TableCell role="cell" className={cn("min-w-0 p-0 align-top whitespace-normal @min-[58rem]:p-3", className)}>
      <span aria-hidden="true" className="mb-1 block text-sm text-muted-foreground @min-[58rem]:hidden">{label}</span>
      {children}
    </TableCell>
  )
}

function formatDateTime(date: string, time: string) {
  const d = new Date(`${date}T00:00:00`)
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  return `${dateStr} · ${time}`
}

export default async function AdminBookingsPage() {
  const bookings = await getAllBookingsWithRelations()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          {bookings.length} total booking{bookings.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="min-w-0 @min-[58rem]:rounded-lg @min-[58rem]:border @min-[58rem]:border-border @min-[58rem]:bg-card">
        <Table role="table" aria-label="Bookings" className="block @min-[58rem]:table">
          <TableHeader role="rowgroup" className="sr-only @min-[58rem]:not-sr-only @min-[58rem]:table-header-group">
            <TableRow role="row">
              {["Reference", "Customer", "Service", "Therapist", "Date & time", "Guests", "Total", "Status"].map((label) => (
                <TableHead key={label} role="columnheader" scope="col" className="px-3 whitespace-normal">{label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody role="rowgroup" className="grid gap-3 [&_tr:last-child]:border @min-[58rem]:table-row-group @min-[58rem]:[&_tr:last-child]:border-0">
            {bookings.map((booking) => (
              <TableRow key={booking.id} role="row" className="grid grid-cols-2 items-start gap-4 rounded-lg border border-border bg-card p-4 @min-[40rem]:grid-cols-4 @min-[58rem]:table-row @min-[58rem]:rounded-none @min-[58rem]:border-x-0 @min-[58rem]:border-t-0 @min-[58rem]:bg-transparent @min-[58rem]:p-0">
                <BookingField label="Reference"><span className="font-mono">{booking.reference}</span></BookingField>
                <BookingField label="Customer">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{booking.customerName}</span>
                    <span className="text-sm text-muted-foreground">{booking.phone}</span>
                  </div>
                </BookingField>
                <BookingField label="Service">
                  <div className="flex flex-col">
                    <span>{booking.service?.nameEn ?? "—"}</span>
                    <span className="text-sm text-muted-foreground">{booking.durationMinutes} min</span>
                  </div>
                </BookingField>
                <BookingField label="Therapist">{booking.therapist?.code ?? "No preference"}</BookingField>
                <BookingField label="Date & time" className="col-span-2 @min-[40rem]:col-span-1">
                  {formatDateTime(booking.date, booking.time)}
                  <p className="text-muted-foreground">Language: {booking.locale ? { en: "English", vi: "Tiếng Việt", ko: "한국어" }[booking.locale] : "Not recorded"}</p>
                  {(() => {
                    const request = ["pending", "confirmed"].includes(booking.status) ? pendingChangeRequest(booking.activity) : null
                    if (!request) return null
                    return <BookingChangeRequest bookingId={booking.id} request={request.kind === "cancel" ? { kind: "cancel" } : { kind: "reschedule", label: formatDateTime(request.date, request.time) }} />
                  })()}
                  {booking.activity.length > 0 && <details className="mt-2">
                    <summary className="cursor-pointer">Booking history</summary>
                    <ol className="mt-2 flex list-inside list-disc flex-col gap-2">
                      {booking.activity.map((event, index) => <li key={`${event.at}-${index}`}><span className="capitalize">{event.kind.replaceAll("_", " ")}</span> · {formatDateTime(event.date, event.time)}<br /><time dateTime={event.at} className="text-muted-foreground">{new Date(event.at).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })} ICT</time></li>)}
                    </ol>
                  </details>}
                </BookingField>
                <BookingField label="Guests">{booking.guests}</BookingField>
                <BookingField label="Total"><span className="font-medium">{formatVnd(booking.totalVnd)}</span></BookingField>
                <BookingField label="Status" className="col-span-2 border-t border-border pt-3 @min-[40rem]:col-span-1 @min-[40rem]:border-0 @min-[40rem]:pt-0 @min-[58rem]:pt-3">
                  <BookingStatusSelect bookingId={booking.id} status={booking.status} revoked={Boolean(booking.accessTokenRevokedAt)} />
                </BookingField>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow role="row" className="block rounded-lg border border-border bg-card @min-[58rem]:table-row @min-[58rem]:border-0">
                <TableCell role="cell" colSpan={8} className="block py-10 text-center text-muted-foreground @min-[58rem]:table-cell">
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
