export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled", "rejected"] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

// Rejected bookings are terminal; cancelled bookings can still be restored with a schedule check.
const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ["confirmed", "cancelled", "rejected"],
  confirmed: ["pending", "completed", "cancelled"],
  completed: [],
  cancelled: ["pending", "confirmed"],
  rejected: [],
}

export function isBookingStatus(value: string): value is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(value)
}

export function allowedBookingStatuses(from: string): BookingStatus[] {
  return isBookingStatus(from) ? [from, ...TRANSITIONS[from]] : []
}

export function canTransitionBookingStatus(from: string, to: string) {
  return isBookingStatus(from) && isBookingStatus(to) && (from === to || TRANSITIONS[from].includes(to))
}
