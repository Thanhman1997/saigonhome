import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { completeOverdueConfirmedBookings } from "@/lib/booking-completion"
import { hasValidCronSecret } from "@/lib/cron-auth"
import { sendBookingReviewInvitation } from "@/lib/booking-review-invitation-email"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!hasValidCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const completed = await completeOverdueConfirmedBookings()
  const invitations: boolean[] = []
  for (let index = 0; index < completed.length; index += 5) {
    invitations.push(...await Promise.all(completed.slice(index, index + 5).map((booking) => sendBookingReviewInvitation(booking))))
  }

  if (completed.length > 0) {
    revalidatePath("/admin/dashboard")
    revalidatePath("/admin/bookings")
  }

  return NextResponse.json({
    completed: completed.length,
    reviewInvitationsAccepted: invitations.filter(Boolean).length,
    checked: completed.length,
  })
}
