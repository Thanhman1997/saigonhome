export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

// Completed is terminal. Cancelled bookings can be restored (the schedule is re-checked when that happens).
const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["pending", "completed", "cancelled"],
  completed: [],
  cancelled: ["pending", "confirmed"],
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
