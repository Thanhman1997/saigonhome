import type { Metadata } from "next"
import Link from "next/link"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { bookings, services, therapists } from "@/lib/db/schema"
import { createBookingReviewToken, verifyBookingReviewToken } from "@/lib/booking-review-token"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { pendingChangeRequest } from "@/lib/booking-change-request"
import { formatVnd } from "@/lib/pricing"
import { hashBookingConfirmationToken } from "@/lib/booking-confirmation-token"
import { isPaymentMethod, PAYMENT_METHOD_LABELS } from "@/lib/payments/methods"
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

export default async function BookingReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string | string[]; c?: string | string[]; decision?: string | string[] }> }) {
  const { id: rawId } = await params
  const { t: rawViewToken, c: rawConfirmationToken, decision: rawDecision } = await searchParams
  const token = typeof rawViewToken === "string" ? rawViewToken : undefined
  const id = Number(rawId)
  const validId = Number.isSafeInteger(id) && id > 0
  const validLink = validId && verifyBookingReviewToken(id, token)
  const isAdmin = validId ? await isAdminAuthenticated() : false
  const canReview = validId && (validLink || isAdmin)

  const [row] = canReview
    ? await db.select({ booking: bookings, service: services, therapist: therapists }).from(bookings).leftJoin(services, eq(bookings.serviceId, services.id)).leftJoin(therapists, eq(bookings.therapistId, therapists.id)).where(eq(bookings.id, id)).limit(1)
    : []

  if (!row) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-foreground">This link is invalid or expired</h1>
        <p className="text-sm text-muted-foreground">Sign in to the admin dashboard, then reopen this email link to review the booking.</p>
        <Link href="/admin/bookings" className="text-sm font-medium text-primary underline">Open bookings</Link>
      </Shell>
    )
  }

  const { booking, service, therapist } = row
  const suppliedConfirmationToken = typeof rawConfirmationToken === "string" && /^[A-Za-z0-9_-]{43}$/.test(rawConfirmationToken)
    ? rawConfirmationToken
    : undefined
  const oneTimeToken = suppliedConfirmationToken
    && booking.status === "pending"
    && booking.confirmationTokenHash === hashBookingConfirmationToken(suppliedConfirmationToken)
    && booking.confirmationTokenExpiresAt
    && booking.confirmationTokenExpiresAt > new Date()
    ? suppliedConfirmationToken
    : undefined
  const open = ["pending", "confirmed"].includes(booking.status)
  const request = open ? pendingChangeRequest(booking.activity) : null
  const awaitingConfirmation = !request && booking.status === "pending"
  const canDecide = Boolean(oneTimeToken) || isAdmin || Boolean(request && validLink)

  const heading = request ? (request.kind === "cancel" ? "Customer asked to cancel" : "Customer asked to change the time") : awaitingConfirmation ? "New booking to confirm" : "Nothing left to confirm"
  const confirmLabel = request ? (request.kind === "cancel" ? "Confirm cancellation" : "Confirm new time") : "CONFIRM BOOKING"
  const selectedDecision = rawDecision === "confirm" || rawDecision === "reject" ? rawDecision : null
  const paymentMethod = isPaymentMethod(booking.paymentMethod) ? PAYMENT_METHOD_LABELS[booking.paymentMethod].en : booking.paymentMethod

  return (
    <Shell>
      <div>
        <h1 className="text-xl font-semibold text-foreground text-balance">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reference {booking.reference}</p>
        {selectedDecision && awaitingConfirmation && <p className="mt-2 text-sm font-medium text-foreground">Selected action: {selectedDecision === "confirm" ? "Confirm booking" : "Reject booking"}. Review the details and choose below to apply it.</p>}
      </div>
      <dl className="divide-y divide-border">
        <Row label="Customer" value={booking.customerName} />
        <Row label="Email" value={booking.email} />
        <Row label="Phone" value={booking.phone} />
        <Row label="Service" value={`${service?.nameEn ?? "Service"} (${booking.durationMinutes} min)`} />
        <Row label="Therapist" value={therapist?.code ?? "No preference / to be assigned"} />
        <Row label="Current time" value={`${booking.date} at ${booking.time} Vietnam time`} />
        {request?.kind === "reschedule" && <Row label="Requested time" value={`${request.date} at ${request.time}`} />}
        <Row label="Guests" value={String(booking.guests)} />
        <Row label="Payment method" value={paymentMethod} />
        <Row label="Address" value={[booking.address, booking.detailedAddress].filter(Boolean).join(" — ")} />
        {booking.notes && <Row label="Customer notes" value={booking.notes} />}
        <Row label="Subtotal" value={formatVnd(booking.subtotalVnd)} />
        {booking.discountLabel && <Row label="Discount" value={`${booking.discountLabel} (-${formatVnd(booking.discountVnd)})`} />}
        <Row label="Total" value={formatVnd(booking.totalVnd)} />
        <Row label="Status" value={booking.status} />
      </dl>
      {request || awaitingConfirmation ? (
        canDecide ? (
          <BookingEmailReview
            bookingId={booking.id}
            oneTimeToken={oneTimeToken}
            isAdmin={isAdmin}
            tokens={{
              confirm: request ? createBookingReviewToken(booking.id, undefined, "approve-change") ?? "" : "",
              decline: request ? createBookingReviewToken(booking.id, undefined, "decline-change") ?? "" : "",
            }}
            mode={request ? "change" : "new"}
            confirmLabel={confirmLabel}
          />
        ) : (
          <p className="text-sm text-muted-foreground">This link is view-only or expired. Sign in to review and decide this booking.</p>
        )
      ) : (
        <p className="text-sm text-muted-foreground">This booking is {booking.status}, so there is nothing to confirm.</p>
      )}
      <Link href="/admin/bookings" className="text-sm text-muted-foreground underline">Open the admin dashboard</Link>
    </Shell>
  )
}
