type ActivityEvent = { kind: string; at: string; date: string; time: string; requestedDate?: string; requestedTime?: string }

export type PendingChangeRequest =
  | { kind: "cancel"; at: string }
  | { kind: "reschedule"; at: string; date: string; time: string }

const resolvingKinds = new Set(["rescheduled", "cancelled", "change_declined"])

// A customer request stays pending until the admin applies it, cancels the booking, or declines it.
export function pendingChangeRequest(activity: ActivityEvent[] | null | undefined): PendingChangeRequest | null {
  const events = activity ?? []
  for (let index = events.length - 1; index >= 0; index--) {
    const event = events[index]
    if (event.kind === "cancel_requested") return { kind: "cancel", at: event.at }
    if (event.kind === "reschedule_requested" && event.requestedDate && event.requestedTime) {
      return { kind: "reschedule", at: event.at, date: event.requestedDate, time: event.requestedTime }
    }
    if (resolvingKinds.has(event.kind)) return null
  }
  return null
}
