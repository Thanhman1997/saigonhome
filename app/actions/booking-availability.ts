"use server"

import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { bookingSettings, serviceDurations, services } from "@/lib/db/schema"
import { allowBookingRequest } from "@/lib/booking-rate-limit"
import { availableBookingSlots } from "@/lib/booking-availability"
import { MAX_BOOKING_GUESTS } from "@/lib/booking-rules"

type BookingTimesInput = {
  serviceId: number
  durationMinutes: number
  therapistId: number | null
  guests: number
  date: string
}

type BookingTimesResult =
  | { ok: true; times: string[]; maxGuests: number }
  | { ok: false; error: "unavailable" }

const unavailable = { ok: false, error: "unavailable" } as const

export async function getAvailableBookingTimes(input: unknown): Promise<BookingTimesResult> {
  try {
    if (!input || typeof input !== "object") return unavailable
    const request = input as Partial<BookingTimesInput>
    if (
      typeof request.serviceId !== "number" || !Number.isSafeInteger(request.serviceId) || request.serviceId < 1 ||
      typeof request.durationMinutes !== "number" || !Number.isSafeInteger(request.durationMinutes) || request.durationMinutes < 1 ||
      (request.therapistId !== null && (typeof request.therapistId !== "number" || !Number.isSafeInteger(request.therapistId) || request.therapistId < 1)) ||
      typeof request.guests !== "number" || !Number.isSafeInteger(request.guests) || request.guests < 1 || request.guests > MAX_BOOKING_GUESTS ||
      typeof request.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(request.date)
    ) return unavailable
    if (!(await allowBookingRequest("read"))) return unavailable

    const [[service], [duration], [settings]] = await Promise.all([
      db.select({ id: services.id }).from(services).where(and(eq(services.id, request.serviceId), eq(services.active, true))).limit(1),
      db.select({ minutes: serviceDurations.minutes }).from(serviceDurations).where(and(
        eq(serviceDurations.serviceId, request.serviceId),
        eq(serviceDurations.minutes, request.durationMinutes),
      )).limit(1),
      db.select({ maxGuests: bookingSettings.maxGuests }).from(bookingSettings).limit(1),
    ])
    const maxGuests = Math.min(settings?.maxGuests ?? MAX_BOOKING_GUESTS, MAX_BOOKING_GUESTS)
    if (!service || !duration || request.guests > maxGuests) return { ok: true, times: [], maxGuests }

    const slots = await availableBookingSlots(db, {
      therapistId: request.therapistId,
      guests: request.guests,
      durationMinutes: duration.minutes,
      date: request.date,
      time: "",
    }, request.date, new Date())

    return { ok: true, times: slots.map((slot) => slot.time), maxGuests }
  } catch {
    console.error("Could not load booking availability")
    return unavailable
  }
}
