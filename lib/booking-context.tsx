"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type ServiceWithDurations = {
  id: number
  slug: string
  icon: string
  nameEn: string
  nameKo: string
  nameVi: string
  descEn: string
  descKo: string
  descVi: string
  imageUrl: string | null
  durations: { id: number; serviceId: number; minutes: number; priceVnd: number }[]
}

export type TherapistRow = {
  id: number
  code: string
  age: number | null
  heightCm: number | null
  weightKg: number | null
  experienceYears: number | null
  locationEn: string | null
  locationKo: string | null
  locationVi: string | null
  languages: string | null
  bioEn: string | null
  bioKo: string | null
  bioVi: string | null
  photoUrl: string | null
  available: boolean
}

type BookingDraft = {
  serviceId: number | null
  durationMinutes: number | null
  therapistId: number | null
  guests: number
  date: string | null
  time: string | null
}

type BookingContextValue = {
  isOpen: boolean
  draft: BookingDraft
  services: ServiceWithDurations[]
  therapists: TherapistRow[]
  openBooking: (preset?: Partial<BookingDraft>) => void
  closeBooking: () => void
  updateDraft: (patch: Partial<BookingDraft>) => void
  resetDraft: () => void
}

const emptyDraft: BookingDraft = {
  serviceId: null,
  durationMinutes: null,
  therapistId: null,
  guests: 1,
  date: null,
  time: null,
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({
  children,
  services,
  therapists,
}: {
  children: ReactNode
  services: ServiceWithDurations[]
  therapists: TherapistRow[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<BookingDraft>(emptyDraft)

  function openBooking(preset?: Partial<BookingDraft>) {
    if (preset) setDraft((prev) => ({ ...prev, ...preset }))
    setIsOpen(true)
  }

  function closeBooking() {
    setIsOpen(false)
  }

  function updateDraft(patch: Partial<BookingDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  function resetDraft() {
    setDraft(emptyDraft)
  }

  return (
    <BookingContext.Provider
      value={{ isOpen, draft, services, therapists, openBooking, closeBooking, updateDraft, resetDraft }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error("useBooking must be used within BookingProvider")
  return ctx
}
