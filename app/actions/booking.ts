"use server"

import { db } from "@/lib/db"
import { bookings, customers, services, serviceDurations, therapists, bookingSettings, serviceAreas, therapistServiceAreas } from "@/lib/db/schema"
import { and, eq, ne, or, sql } from "drizzle-orm"
import { getGroupDiscountRate, getGroupDiscountLabel, DEFAULT_DISCOUNT_RATES, type DiscountRates } from "@/lib/pricing"
import { sendBookingNotifications } from "@/lib/booking-notifications"

export type CreateBookingInput = {
  serviceId: number
  durationMinutes: number
  therapistId: number | null
  guests: number
  date: string
  time: string
  customerName: string
  email: string
  phone: string
  address: string
  detailedAddress: string
  serviceAreaId?: number | null
  notes: string
  isFirstTime: boolean
}

export type CreateBookingResult =
  | { success: true; reference: string; totalVnd: number; subtotalVnd: number; discountVnd: number }
  | { success: false; error: string }

function generateReference(): string {
  const stamp = getVietnamDateString().replaceAll("-", "").slice(2)
  return `LW-${stamp}-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh"

function getVietnamDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function vietnamLocalToUtcMs(date: string, time: string): number {
  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  return Date.UTC(year, month - 1, day, hour + 7, minute)
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number)
  const result = new Date(Date.UTC(year, month - 1, day + days))
  return [result.getUTCFullYear(), String(result.getUTCMonth() + 1).padStart(2, "0"), String(result.getUTCDate()).padStart(2, "0")].join("-")
}

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number)
  return hour * 60 + minute
}

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  try {
    if (!input.customerName?.trim()) return { success: false, error: "Name is required" }
    if (!isValidEmail(input.email)) return { success: false, error: "Invalid email" }
    if (!input.phone?.trim()) return { success: false, error: "Phone is required" }
    if (!input.address?.trim()) return { success: false, error: "Address is required" }
    if (!input.date || !input.time) return { success: false, error: "Date and time are required" }

    const [settingsRow] = await db.select().from(bookingSettings).limit(1)
    const rates: DiscountRates = settingsRow
      ? {
          groupDiscount2: Number(settingsRow.groupDiscount2),
          groupDiscount3: Number(settingsRow.groupDiscount3),
          groupDiscount4: Number(settingsRow.groupDiscount4),
          firstTimeDiscount: Number(settingsRow.firstTimeDiscount),
        }
      : DEFAULT_DISCOUNT_RATES
    const maxGuests = settingsRow?.maxGuests ?? 20
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(input.date) || !/^[0-9]{2}:[0-9]{2}$/.test(input.time)) {
      return { success: false, error: "Invalid date or time" }
    }

    const now = new Date()
    const vietnamToday = getVietnamDateString(now)
    const [year, month, day] = input.date.split("-").map(Number)
    const parsedDate = new Date(Date.UTC(year, month - 1, day))
    const isCalendarDateValid = parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 && parsedDate.getUTCDate() === day
    const [hours, minutes] = input.time.split(":").map(Number)
    const isClockTimeValid = hours < 24 && minutes < 60
    if (!isCalendarDateValid || !isClockTimeValid) return { success: false, error: "Invalid date or time" }

    const maxDate = addDays(vietnamToday, settingsRow?.advanceBookingDays ?? 30)
    const weekday = parsedDate.getUTCDay()
    const [openHour, openMinute] = (settingsRow?.openTime ?? "09:00").split(":").map(Number)
    const [closeHour, closeMinute] = (settingsRow?.closeTime ?? "21:00").split(":").map(Number)
    const openingMinutes = openHour * 60 + openMinute
    const closingMinutes = closeHour * 60 + closeMinute
    const requestedMinutes = hours * 60 + minutes
    const bookingUtcMs = vietnamLocalToUtcMs(input.date, input.time)
    const minBookingUtcMs = now.getTime() + (settingsRow?.minNoticeHours ?? 2) * 60 * 60 * 1000

    if (input.date < vietnamToday || input.date > maxDate) {
      return { success: false, error: "Selected date is outside the booking window" }
    }
    if (settingsRow?.closedWeekdays?.includes(weekday)) return { success: false, error: "Selected day is unavailable" }
    if (requestedMinutes < openingMinutes || requestedMinutes >= closingMinutes || bookingUtcMs < minBookingUtcMs) {
      return { success: false, error: "Selected time is unavailable" }
    }

    if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > maxGuests) {
      return { success: false, error: `Invalid number of guests (max ${maxGuests})` }
    }

    // Look up authoritative service + duration + price server-side. Never trust client price.
    const [service] = await db.select().from(services).where(eq(services.id, input.serviceId)).limit(1)
    if (!service || !service.active) return { success: false, error: "Selected service is unavailable" }

    const [duration] = await db
      .select()
      .from(serviceDurations)
      .where(and(eq(serviceDurations.serviceId, input.serviceId), eq(serviceDurations.minutes, input.durationMinutes)))
      .limit(1)
    if (!duration) return { success: false, error: "Selected duration is unavailable for this service" }

    if (input.therapistId) {
      const [therapist] = await db.select().from(therapists).where(eq(therapists.id, input.therapistId)).limit(1)
      if (!therapist || !therapist.available || therapist.status !== "active") {
        return { success: false, error: "Selected therapist is unavailable" }
      }
    }

    if (input.therapistId) {
      const requestedStart = timeToMinutes(input.time)
      const requestedEnd = requestedStart + input.durationMinutes
      const existingBookings = await db
        .select({ time: bookings.time, durationMinutes: bookings.durationMinutes })
        .from(bookings)
        .where(and(eq(bookings.therapistId, input.therapistId), eq(bookings.date, input.date), ne(bookings.status, "cancelled"), ne(bookings.status, "no_show")))
        .limit(100)

      const hasOverlap = existingBookings.some((booking) => {
        const existingStart = timeToMinutes(booking.time)
        const existingEnd = existingStart + booking.durationMinutes
        return requestedStart < existingEnd && existingStart < requestedEnd
      })

      if (hasOverlap) return { success: false, error: "Therapist already booked at this time" }
    }

    let selectedArea: { id: number; nameEn: string; defaultSurchargeVnd: number; defaultTravelMinutes: number } | null = null
    let travelSurchargeVnd = 0
    let travelMinutes = 0
    if (input.serviceAreaId) {
      const [area] = await db.select().from(serviceAreas).where(and(eq(serviceAreas.id, input.serviceAreaId), eq(serviceAreas.active, true))).limit(1)
      if (!area) return { success: false, error: "Selected service area is unavailable" }
      selectedArea = area
      const assignment = input.therapistId
        ? (await db.select().from(therapistServiceAreas).where(and(eq(therapistServiceAreas.therapistId, input.therapistId), eq(therapistServiceAreas.serviceAreaId, input.serviceAreaId), eq(therapistServiceAreas.active, true))).limit(1))[0]
        : null
      if (input.therapistId && !assignment) return { success: false, error: "Selected therapist does not serve this area" }
      travelSurchargeVnd = assignment?.surchargeVnd ?? area.defaultSurchargeVnd
      travelMinutes = assignment?.travelMinutes ?? area.defaultTravelMinutes
    }

    const subtotal = duration.priceVnd * input.guests

    // Compute discount server-side. First-time discount and group discount are mutually exclusive;
    // apply whichever is greater for the customer.
    const groupRate = getGroupDiscountRate(input.guests, rates)
    const firstTimeRate = input.isFirstTime ? rates.firstTimeDiscount : 0
    const appliedRate = Math.max(groupRate, firstTimeRate)
    const discountVnd = Math.round(subtotal * appliedRate)
    const totalVnd = subtotal + travelSurchargeVnd - discountVnd

    let discountLabel: string | null = null
    if (appliedRate === firstTimeRate && firstTimeRate > 0) {
      discountLabel = `First-time customer discount: ${Math.round(firstTimeRate * 100)}% off`
    } else if (appliedRate === groupRate && groupRate > 0) {
      discountLabel = getGroupDiscountLabel(input.guests, rates)
    }

    const reference = generateReference()
    const normalizedEmail = input.email.trim().toLowerCase()
    const normalizedPhone = input.phone.trim()
    const existingCustomer = (await db.select().from(customers).where(or(eq(customers.email, normalizedEmail), eq(customers.phone, normalizedPhone))).limit(1))[0]
    const customer = existingCustomer
      ? (await db.update(customers).set({ name: input.customerName.trim(), email: normalizedEmail, phone: normalizedPhone, totalBookings: sql`${customers.totalBookings} + 1`, updatedAt: new Date() }).where(eq(customers.id, existingCustomer.id)).returning())[0]
      : (await db.insert(customers).values({ name: input.customerName.trim(), email: normalizedEmail, phone: normalizedPhone, totalBookings: 1 }).returning())[0]

    await db.insert(bookings).values({
      reference,
      customerId: customer.id,
      serviceId: input.serviceId,
      durationMinutes: input.durationMinutes,
      therapistId: input.therapistId,
      date: input.date,
      time: input.time,
      guests: input.guests,
      customerName: input.customerName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      detailedAddress: input.detailedAddress?.trim() || null,
      serviceAreaId: selectedArea?.id ?? null,
      serviceAreaName: selectedArea?.nameEn ?? null,
      travelSurchargeVnd,
      travelMinutes,
      notes: input.notes?.trim() || null,
      subtotalVnd: subtotal,
      discountVnd,
      totalVnd,
      discountLabel,
      status: "pending",
    })

    void sendBookingNotifications((await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.reference, reference)).limit(1))[0]?.id ?? 0, "received")

    return { success: true, reference, totalVnd, subtotalVnd: subtotal, discountVnd }
  } catch (error) {
    console.error("[v0] createBooking error:", error)
    const message = error instanceof Error ? error.message : ""
    if (message.includes("updated_at") || message.includes("column") && message.includes("does not exist")) {
      return { success: false, error: "Booking system is being updated. Please try again in a moment." }
    }
    if (message.includes("duplicate key") || message.includes("bookings_reference_key")) {
      return { success: false, error: "This booking could not be saved. Please submit again." }
    }
    return { success: false, error: "We could not confirm your booking. Please check your details and try again." }
  }
}

