"use server"

import { db } from "@/lib/db"
import { bookings, services, serviceDurations, therapists, bookingSettings } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { getGroupDiscountRate, getGroupDiscountLabel, DEFAULT_DISCOUNT_RATES, type DiscountRates } from "@/lib/pricing"
import { randomInt } from "node:crypto"
import { issueBookingToken } from "@/lib/booking-management-token"
import { adminBookingReviewUrl } from "@/lib/booking-review-token"
import { allowBookingRequest } from "@/lib/booking-rate-limit"
import { sendTransactionalEmail } from "@/lib/transactional-email"
import { zonedLocalDateTimeToUtc } from "@/lib/timezone"
import { escapeHtml } from "@/lib/security"
import { lockBookingSchedule, overlappingBookings } from "@/lib/booking-availability"
import { sendBookingManagementEmail } from "@/lib/booking-management-email"
import { enqueueBookingKakaoNotification } from "@/lib/kakao-notifications"
import { asBookingLocale, type Locale } from "@/lib/booking-management-locale"
import { isPaymentMethod, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/payments/methods"
import { MAX_BOOKING_GUESTS, MIN_BOOKING_NOTICE_MS } from "@/lib/booking-rules"

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
  isFirstTime?: boolean
  paymentMethod?: PaymentMethod
  locale?: Locale
  submissionKey?: string
}

export type BookingReceipt = { reference: string; totalVnd: number; subtotalVnd: number; discountVnd: number; managementEmailSent: boolean; locale: Locale }

export type CreateBookingResult =
  | ({ success: true } & BookingReceipt)
  | { success: false; error: string }

function generateReference(): string {
  return String(randomInt(10000, 100000))
}

function getDatabaseErrorDetails(error: unknown) {
  if (typeof error !== "object" || error === null) return null
  const candidate = error as { code?: unknown; constraint?: unknown }
  if (typeof candidate.code !== "string") return null
  return {
    code: candidate.code,
    constraint: typeof candidate.constraint === "string" ? candidate.constraint : undefined,
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh"

function getVietnamDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  try {
    if (!input || typeof input.customerName !== "string" || !input.customerName.trim() || input.customerName.length > 120) return { success: false, error: "Name is required" }
    if (typeof input.email !== "string" || input.email.length > 254 || !isValidEmail(input.email.trim())) return { success: false, error: "Invalid email" }
    if (typeof input.phone !== "string" || !/^[+() .0-9-]{7,40}$/.test(input.phone) || !/^\d{7,15}$/.test(input.phone.replace(/\D/g, ""))) return { success: false, error: "Phone is required" }
    if (typeof input.address !== "string" || !input.address.trim() || input.address.length > 500 || (input.detailedAddress != null && (typeof input.detailedAddress !== "string" || input.detailedAddress.length > 500))) return { success: false, error: "Address is required" }
    if (typeof input.date !== "string" || typeof input.time !== "string" || !input.date || !input.time) return { success: false, error: "Date and time are required" }
    if (!Number.isSafeInteger(input.serviceId) || !Number.isSafeInteger(input.durationMinutes)) return { success: false, error: "Selected service is unavailable" }
    if (input.therapistId !== null && (!Number.isSafeInteger(input.therapistId) || input.therapistId < 1)) return { success: false, error: "Selected therapist is unavailable" }
    if (input.notes != null && (typeof input.notes !== "string" || input.notes.length > 2000)) return { success: false, error: "Something went wrong. Please try again." }
    const submissionKey = input.submissionKey ?? null
    if (submissionKey !== null && (typeof submissionKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionKey))) return { success: false, error: "Something went wrong. Please try again." }
    const paymentMethod = input.paymentMethod ?? "CASH"
    if (!isPaymentMethod(paymentMethod)) return { success: false, error: "Something went wrong. Please try again." }
    if (!(await allowBookingRequest("create"))) return { success: false, error: "Please wait before trying again." }
    const locale = asBookingLocale(input.locale) ?? "en"

    const [settingsRow] = await db.select().from(bookingSettings).limit(1)
    const rates: DiscountRates = settingsRow
      ? {
          groupDiscount2: Number(settingsRow.groupDiscount2),
          groupDiscount3: Number(settingsRow.groupDiscount3),
          groupDiscount4: Number(settingsRow.groupDiscount4),
          firstTimeDiscount: Number(settingsRow.firstTimeDiscount),
        }
      : DEFAULT_DISCOUNT_RATES
    const maxGuests = Math.min(settingsRow?.maxGuests ?? MAX_BOOKING_GUESTS, MAX_BOOKING_GUESTS)
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
    const isClockTimeValid = (hours < 24 && minutes < 60 && minutes % 15 === 0) || isMidnight
    if (!isCalendarDateValid || !isClockTimeValid) return { success: false, error: "Invalid date or time" }

    const weekday = parsedDate.getUTCDay()
    const [openHour, openMinute] = (settingsRow?.openTime ?? "09:00").split(":").map(Number)
    const [closeHour, closeMinute] = (settingsRow?.closeTime ?? "00:00").split(":").map(Number)
    const openingMinutes = openHour * 60 + openMinute
    const configuredClosingMinutes = closeHour * 60 + closeMinute
    const closingMinutes = configuredClosingMinutes <= openingMinutes
      ? configuredClosingMinutes + 24 * 60
      : configuredClosingMinutes
    const requestedMinutes = hours * 60 + minutes
    const bookingUtcMs = zonedLocalDateTimeToUtc(input.date, input.time, VIETNAM_TIME_ZONE).getTime()
    const minBookingUtcMs = now.getTime() + MIN_BOOKING_NOTICE_MS

    const maxAdvanceDays = settingsRow?.advanceBookingDays ?? 30
    const maxBookingDate = new Date(`${vietnamToday}T00:00:00Z`)
    maxBookingDate.setUTCDate(maxBookingDate.getUTCDate() + maxAdvanceDays)
    const maxBookingDateString = maxBookingDate.toISOString().slice(0, 10)
    if (input.date < vietnamToday || input.date > maxBookingDateString) {
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
    if (closeHour === 0 && closeMinute === 0
      ? requestedMinutes + duration.minutes >= closingMinutes
      : requestedMinutes + duration.minutes > closingMinutes) {
      return { success: false, error: "Selected time is unavailable" }
    }

    let therapistCode: string | null = null
    if (input.therapistId) {
      const [therapist] = await db.select().from(therapists).where(eq(therapists.id, input.therapistId)).limit(1)
      if (!therapist || !therapist.available || !therapist.visible) {
        return { success: false, error: "Selected therapist is unavailable" }
      }
      therapistCode = therapist.code
    }

    const subtotal = duration.priceVnd * input.guests

    // Compute discount server-side. First-time discount and group discount are mutually exclusive;
    // apply whichever is greater for the customer.
    const groupRate = getGroupDiscountRate(input.guests, rates)
    const [pastBooking] = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.email, input.email.trim())).limit(1)
    const firstTimeRate = pastBooking ? 0 : rates.firstTimeDiscount
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

    let reference = generateReference()
    const startAt = zonedLocalDateTimeToUtc(input.date, input.time, "Asia/Ho_Chi_Minh")
    const endAt = new Date(startAt.getTime() + input.durationMinutes * 60 * 1000)

    const access = issueBookingToken()
    const save = () => db.transaction(async (tx) => {
      await lockBookingSchedule(tx)
      if (submissionKey) {
        const [previous] = await tx.select({ reference: bookings.reference, totalVnd: bookings.totalVnd, subtotalVnd: bookings.subtotalVnd, discountVnd: bookings.discountVnd, confirmation: bookings.confirmationEmailSentAt, locale: bookings.locale })
          .from(bookings).where(and(eq(bookings.submissionKey, submissionKey), eq(bookings.email, input.email.trim()))).limit(1)
        if (previous) return { kind: "duplicate", receipt: previous } as const
      }
      if (startAt.getTime() < Date.now() + MIN_BOOKING_NOTICE_MS) return null
      if ((await overlappingBookings(tx, input, startAt, endAt)).length) return null
      const [created] = await tx.insert(bookings).values({
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
        paymentMethod,
        status: "pending",
        locale,
        submissionKey,
        accessTokenHash: access.hash,
        accessTokenExpiresAt: access.expires,
        activity: [{ kind: "created", at: now.toISOString(), date: input.date, time: input.time }],
        startAt,
        endAt,
      }).returning({ id: bookings.id, email: bookings.email })
      return { kind: "created", booking: created } as const
    })
    let saved: Awaited<ReturnType<typeof save>> | null = null
    let saveCompleted = false
    for (let attempt = 0; !saveCompleted && attempt < 3; attempt += 1) {
      try {
        saved = await save()
        saveCompleted = true
      } catch (error) {
        const databaseError = getDatabaseErrorDetails(error)
        if (databaseError?.code === "23P01" && databaseError.constraint === "bookings_therapist_no_overlap") {
          return { success: false, error: "Selected time is unavailable" }
        }
        if (
          databaseError?.code !== "23505" ||
          databaseError.constraint !== "bookings_reference_key" ||
          attempt >= 2
        ) throw error
        reference = generateReference()
      }
    }
    if (!saved) return { success: false, error: "Selected time is unavailable" }
    if (saved.kind === "duplicate") {
      const { confirmation, ...receipt } = saved.receipt
      return { success: true, ...receipt, managementEmailSent: Boolean(confirmation), locale: receipt.locale ?? locale }
    }

    const bookingDetails = {
      id: saved.booking.id,
      reference,
      serviceName: service.nameEn,
      durationMinutes: input.durationMinutes,
      date: input.date,
      time: input.time,
      guests: input.guests,
      customerName: input.customerName,
      paymentMethod,
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

    const localizedService = { en: service.nameEn, vi: service.nameVi, ko: service.nameKo }[locale]
    const [, managementEmailSent] = await Promise.all([
      sendAdminNotification(bookingDetails),
      sendBookingManagementEmail({ ...saved.booking, reference, date: input.date, time: input.time, status: "pending" }, localizedService, "received", locale, { token: access.token, therapist: therapistCode }).catch(() => {
        console.error("Could not send booking management email")
        return false
      }),
      enqueueBookingKakaoNotification(saved.booking.id).catch((error) => {
        console.error("[v0] Failed to queue Kakao booking notification:", error)
      }),
    ])
    if (managementEmailSent) {
      await db.update(bookings).set({ confirmationEmailSentAt: new Date() }).where(eq(bookings.id, saved.booking.id)).catch(() => {
        console.error("Could not record booking email delivery")
      })
    }

    return { success: true, reference, totalVnd, subtotalVnd: subtotal, discountVnd, managementEmailSent, locale }
  } catch (error) {
    const databaseError = getDatabaseErrorDetails(error)
      console.error("Could not save the booking", databaseError ?? { errorType: error instanceof Error ? error.name : "unknown" })
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

type BookingEmailDetails = {
  id: number
  reference: string
  serviceName: string
  durationMinutes: number
  date: string
  time: string
  guests: number
  customerName: string
  paymentMethod: PaymentMethod
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

async function sendAdminNotification(details: BookingEmailDetails) {
  try {
    const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ"
    const paymentMethod = PAYMENT_METHOD_LABELS[details.paymentMethod]

    await sendTransactionalEmail({
      to: process.env.ADMIN_EMAIL ?? "saigonservice2020@gmail.com",
      replyTo: details.email,
      subject: `New booking — ${details.reference}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="margin-bottom: 4px;">New Booking Received</h2>
          <p style="color: #666; margin-top: 0;">Reference: <strong>${escapeHtml(details.reference)}</strong></p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 6px 0; color: #666;">Service</td><td style="padding: 6px 0;">${escapeHtml(details.serviceName)} (${Number(details.durationMinutes)} min)</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Date &amp; Time</td><td style="padding: 6px 0;">${escapeHtml(details.date)} at ${escapeHtml(details.time)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Guests</td><td style="padding: 6px 0;">${Number(details.guests)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Customer name</td><td style="padding: 6px 0;">${escapeHtml(details.customerName)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Payment method</td><td style="padding: 6px 0;">${paymentMethod.en} (${paymentMethod.vi})</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0;">${escapeHtml(details.email)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Phone</td><td style="padding: 6px 0;">${escapeHtml(details.phone)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Address</td><td style="padding: 6px 0;">${escapeHtml(details.address)}${details.detailedAddress ? ` — ${escapeHtml(details.detailedAddress)}` : ""}</td></tr>
            ${details.notes ? `<tr><td style="padding: 6px 0; color: #666;">Notes</td><td style="padding: 6px 0;">${escapeHtml(details.notes)}</td></tr>` : ""}
            <tr><td style="padding: 6px 0; color: #666;">Subtotal</td><td style="padding: 6px 0;">${fmt(details.subtotalVnd)}</td></tr>
            ${details.discountLabel ? `<tr><td style="padding: 6px 0; color: #666;">Discount</td><td style="padding: 6px 0;">${escapeHtml(details.discountLabel)} (-${fmt(details.discountVnd)})</td></tr>` : ""}
            <tr><td style="padding: 6px 0; color: #666; font-weight: bold;">Total</td><td style="padding: 6px 0; font-weight: bold;">${fmt(details.totalVnd)}</td></tr>
          </table>
          <p style="margin-top: 20px;"><a href="${escapeHtml(adminBookingReviewUrl(details.id))}" style="display: inline-block; padding: 12px 20px; border-radius: 24px; background: #26362f; color: #fff; text-decoration: none;">Confirm booking</a></p>
          <p style="color: #666;">The button opens a secure page where you confirm the booking, with no login needed. The customer receives the confirmation email only after you confirm.</p>
        </div>
      `,
    })
  } catch {
    console.error("Could not send admin booking notification")
  }
}
