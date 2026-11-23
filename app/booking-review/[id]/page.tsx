import type { Metadata } from "next"
import Link from "next/link"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { bookings, services, therapists } from "@/lib/db/schema"
import { createBookingReviewToken, verifyBookingReviewToken } from "@/lib/booking-review-token"
import { pendingChangeRequest } from "@/lib/booking-change-request"
import { formatVnd } from "@/lib/pricing"
import { BookingEmailReview } from "@/components/admin/booking-email-review"

export const metadata: Metadata = { title: "Confirm booking", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-lg border border-border bg-card p-6">{children}</div>
    </main>
  )
}

export default async function BookingReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { id: rawId } = await params
  const { t: token } = await searchParams
  const id = Number(rawId)

  const [row] = verifyBookingReviewToken(id, token)
    ? await db.select({ booking: bookings, service: services, therapist: therapists }).from(bookings).leftJoin(services, eq(bookings.serviceId, services.id)).leftJoin(therapists, eq(bookings.therapistId, therapists.id)).where(eq(bookings.id, id)).limit(1)
    : []

  if (!row || !token) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-foreground">This link has expired</h1>
        <p className="text-sm text-muted-foreground">Sign in to the admin dashboard to review the booking.</p>
        <Link href="/admin/bookings" className="text-sm font-medium text-primary underline">Open bookings</Link>
      </Shell>
    )
  }

  const { booking, service, therapist } = row
  const open = ["pending", "confirmed"].includes(booking.status)
  const request = open ? pendingChangeRequest(booking.activity) : null
  const awaitingConfirmation = !request && booking.status === "pending"

  const heading = request ? (request.kind === "cancel" ? "Customer asked to cancel" : "Customer asked to change the time") : awaitingConfirmation ? "New booking to confirm" : "Nothing left to confirm"
  const confirmLabel = request ? (request.kind === "cancel" ? "Confirm cancellation" : "Confirm new time") : "Confirm booking"

  return (
    <Shell>
      <div>
        <h1 className="text-xl font-semibold text-foreground text-balance">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reference {booking.reference}</p>
      </div>
      <dl className="divide-y divide-border">
        <Row label="Customer" value={booking.customerName} />
        <Row label="Phone" value={booking.phone} />
        <Row label="Service" value={`${service?.nameEn ?? "Service"} (${booking.durationMinutes} min)`} />
        <Row label="Therapist" value={therapist?.code ?? "No preference"} />
        <Row label="Current time" value={`${booking.date} at ${booking.time}`} />
        {request?.kind === "reschedule" && <Row label="Requested time" value={`${request.date} at ${request.time}`} />}
        <Row label="Guests" value={String(booking.guests)} />
        <Row label="Address" value={[booking.address, booking.detailedAddress].filter(Boolean).join(" — ")} />
        <Row label="Total" value={formatVnd(booking.totalVnd)} />
        <Row label="Status" value={booking.status} />
      </dl>
      {request || awaitingConfirmation ? (
        <BookingEmailReview
          bookingId={booking.id}
          tokens={{
            confirm: createBookingReviewToken(booking.id, undefined, request ? "approve-change" : "confirm") ?? "",
            decline: createBookingReviewToken(booking.id, undefined, "decline-change") ?? "",
          }}
          mode={request ? "change" : "new"}
          confirmLabel={confirmLabel}
        />
      ) : (
        <p className="text-sm text-muted-foreground">This booking is {booking.status}, so there is nothing to confirm.</p>
      )}
      <Link href="/admin/bookings" className="text-sm text-muted-foreground underline">Open the admin dashboard</Link>
    </Shell>
  )
}
