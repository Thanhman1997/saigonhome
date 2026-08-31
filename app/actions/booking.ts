"use server"

import { db } from "@/lib/db"
import { bookings, services, serviceDurations, therapists, bookingSettings } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { getGroupDiscountRate, getGroupDiscountLabel, DEFAULT_DISCOUNT_RATES, type DiscountRates } from "@/lib/pricing"
import { Resend } from "resend"
import { zonedLocalDateTimeToUtc } from "@/lib/timezone"
import { escapeHtml } from "@/lib/security"

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
  notes: string
  isFirstTime: boolean
}

export type CreateBookingResult =
  | { success: true; reference: string; totalVnd: number; subtotalVnd: number; discountVnd: number }
  | { success: false; error: string }

function generateReference(): string {
  return String(Math.floor(10000 + Math.random() * 90000))
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
    const isMidnight = hours === 24 && minutes === 0
    const isClockTimeValid = (hours < 24 && minutes < 60) || isMidnight
    if (!isCalendarDateValid || !isClockTimeValid) return { success: false, error: "Invalid date or time" }

    const weekday = parsedDate.getUTCDay()
    const [openHour, openMinute] = (settingsRow?.openTime ?? "09:00").split(":").map(Number)
    const [closeHour, closeMinute] = (settingsRow?.closeTime ?? "21:00").split(":").map(Number)
    const openingMinutes = openHour * 60 + openMinute
    const closingMinutes = closeHour * 60 + closeMinute
    const requestedMinutes = hours * 60 + minutes
    const bookingUtcMs = vietnamLocalToUtcMs(input.date, input.time)
    const minBookingUtcMs = now.getTime() + (settingsRow?.minNoticeHours ?? 2) * 60 * 60 * 1000

    if (input.date < vietnamToday) {
      return { success: false, error: "Selected date is outside the booking window" }
    }
    if (settingsRow?.closedWeekdays?.includes(weekday)) return { success: false, error: "Selected day is unavailable" }
    if (requestedMinutes < openingMinutes || requestedMinutes > closingMinutes || bookingUtcMs < minBookingUtcMs) {
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
      if (!therapist || !therapist.available) {
        return { success: false, error: "Selected therapist is unavailable" }
      }
    }

    const subtotal = duration.priceVnd * input.guests

    // Compute discount server-side. First-time discount and group discount are mutually exclusive;
    // apply whichever is greater for the customer.
    const groupRate = getGroupDiscountRate(input.guests, rates)
    const firstTimeRate = input.isFirstTime ? rates.firstTimeDiscount : 0
    const holidayGroupRate = input.guests >= 2 && input.date >= "2026-09-01" && input.date <= "2026-09-03" ? 0.05 : 0
    const appliedRate = Math.max(groupRate, firstTimeRate, holidayGroupRate)
    const discountVnd = Math.round(subtotal * appliedRate)
    const totalVnd = subtotal - discountVnd

    let discountLabel: string | null = null
    if (appliedRate === firstTimeRate && firstTimeRate > 0) {
      discountLabel = `First-time customer discount: ${Math.round(firstTimeRate * 100)}% off`
    } else if (appliedRate === holidayGroupRate && holidayGroupRate > 0) {
      discountLabel = "National Day group discount: 5% off"
    } else if (appliedRate === groupRate && groupRate > 0) {
      discountLabel = getGroupDiscountLabel(input.guests, rates)
    }

    const reference = generateReference()
    const startAt = zonedLocalDateTimeToUtc(input.date, input.time, "Asia/Ho_Chi_Minh")
    const endAt = new Date(startAt.getTime() + input.durationMinutes * 60 * 1000)

    await db.insert(bookings).values({
      reference,
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
      notes: input.notes?.trim() || null,
      subtotalVnd: subtotal,
      discountVnd,
      totalVnd,
      discountLabel,
      status: "confirmed",
      startAt,
      endAt,
    })

    const bookingDetails = {
      reference,
      serviceName: service.nameEn,
      durationMinutes: input.durationMinutes,
      date: input.date,
      time: input.time,
      guests: input.guests,
      customerName: input.customerName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      detailedAddress: input.detailedAddress,
      notes: input.notes,
      subtotalVnd: subtotal,
      discountVnd,
      totalVnd,
      discountLabel,
    }

    await Promise.all([
      sendAdminNotification(bookingDetails),
      sendCustomerConfirmation(bookingDetails),
    ])

    return { success: true, reference, totalVnd, subtotalVnd: subtotal, discountVnd }
  } catch (error) {
    console.error("[v0] createBooking error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

type BookingEmailDetails = {
  reference: string
  serviceName: string
  durationMinutes: number
  date: string
  time: string
  guests: number
  customerName: string
  email: string
  phone: string
  address: string
  detailedAddress: string
  notes: string
  subtotalVnd: number
  discountVnd: number
  totalVnd: number
  discountLabel: string | null
}

async function sendCustomerConfirmation(details: BookingEmailDetails) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  try {
    const resend = new Resend(apiKey)
    const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ"
    await resend.emails.send({
      from: "Lotus Wellness <onboarding@resend.dev>",
      to: details.email,
      subject: `Booking confirmed — ${details.reference}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #24312d;">
          <h2>Booking confirmed</h2>
          <p>Dear ${escapeHtml(details.customerName)}, your Lotus Wellness booking has been received.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 6px 0; color: #666;">Reference</td><td style="padding: 6px 0;"><strong>${escapeHtml(details.reference)}</strong></td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Service</td><td style="padding: 6px 0;">${escapeHtml(details.serviceName)} (${details.durationMinutes} min)</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Date &amp; time</td><td style="padding: 6px 0;">${escapeHtml(details.date)} at ${escapeHtml(details.time)} (Vietnam time)</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Guests</td><td style="padding: 6px 0;">${details.guests}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Total</td><td style="padding: 6px 0; font-weight: bold;">${fmt(details.totalVnd)}</td></tr>
          </table>
          <p style="margin-top: 24px; color: #666;">Please keep your reference number for future changes.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error("[v0] Failed to send customer confirmation email:", error)
  }
}

async function sendAdminNotification(details: BookingEmailDetails) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[v0] RESEND_API_KEY not set, skipping admin email notification")
    return
  }

  try {
    const resend = new Resend(apiKey)
    const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ"

    await resend.emails.send({
      from: "Lotus Wellness <onboarding@resend.dev>",
      to: "saigonservice2020@gmail.com",
      subject: `New booking — ${details.reference}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="margin-bottom: 4px;">New Booking Received</h2>
          <p style="color: #666; margin-top: 0;">Reference: <strong>${details.reference}</strong></p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 6px 0; color: #666;">Service</td><td style="padding: 6px 0;">${details.serviceName} (${details.durationMinutes} min)</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Date &amp; Time</td><td style="padding: 6px 0;">${details.date} at ${details.time}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Guests</td><td style="padding: 6px 0;">${details.guests}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Customer</td><td style="padding: 6px 0;">${escapeHtml(details.customerName)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0;">${details.email}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Phone</td><td style="padding: 6px 0;">${details.phone}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Address</td><td style="padding: 6px 0;">${escapeHtml(details.address)}${details.detailedAddress ? ` — ${escapeHtml(details.detailedAddress)}` : ""}</td></tr>
            ${details.notes ? `<tr><td style="padding: 6px 0; color: #666;">Notes</td><td style="padding: 6px 0;">${escapeHtml(details.notes)}</td></tr>` : ""}
            <tr><td style="padding: 6px 0; color: #666;">Subtotal</td><td style="padding: 6px 0;">${fmt(details.subtotalVnd)}</td></tr>
            ${details.discountLabel ? `<tr><td style="padding: 6px 0; color: #666;">Discount</td><td style="padding: 6px 0;">${details.discountLabel} (-${fmt(details.discountVnd)})</td></tr>` : ""}
            <tr><td style="padding: 6px 0; color: #666; font-weight: bold;">Total</td><td style="padding: 6px 0; font-weight: bold;">${fmt(details.totalVnd)}</td></tr>
          </table>
        </div>
      `,
    })
  } catch (error) {
    console.error("[v0] Failed to send admin notification email:", error)
  }
}
