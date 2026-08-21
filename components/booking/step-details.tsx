"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n/language-provider"

export type CustomerInfo = {
  customerName: string
  email: string
  phone: string
  address: string
  detailedAddress: string
  notes: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function StepDetails({
  customerInfo,
  setCustomerInfo,
  onNext,
  onBack,
}: {
  customerInfo: CustomerInfo
  setCustomerInfo: (info: CustomerInfo) => void
  onNext: () => void
  onBack: () => void
}) {
  const { t } = useLanguage()
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({})

  function handleContinue() {
    const newErrors: Partial<Record<keyof CustomerInfo, string>> = {}
    if (!customerInfo.customerName.trim()) newErrors.customerName = t.booking.required
    if (!customerInfo.email.trim() || !isValidEmail(customerInfo.email)) newErrors.email = t.booking.invalidEmail
    if (!customerInfo.phone.trim()) newErrors.phone = t.booking.required
    if (!customerInfo.address.trim()) newErrors.address = t.booking.required

    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) onNext()
  }

  function update(field: keyof CustomerInfo, value: string) {
    setCustomerInfo({ ...customerInfo, [field]: value })
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif text-2xl">{t.booking.yourInfo}</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="customerName">{t.booking.name}</Label>
          <Input id="customerName" value={customerInfo.customerName} onChange={(e) => update("customerName", e.target.value)} />
          {errors.customerName && <p className="text-xs text-destructive">{errors.customerName}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t.booking.email}</Label>
          <Input id="email" type="email" value={customerInfo.email} onChange={(e) => update("email", e.target.value)} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">{t.booking.phone}</Label>
          <Input id="phone" type="tel" value={customerInfo.phone} onChange={(e) => update("phone", e.target.value)} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="address">{t.booking.address}</Label>
          <Input id="address" value={customerInfo.address} onChange={(e) => update("address", e.target.value)} />
          {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="detailedAddress">{t.booking.detailedAddress}</Label>
          <Input
            id="detailedAddress"
            value={customerInfo.detailedAddress}
            onChange={(e) => update("detailedAddress", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="notes">{t.booking.notes}</Label>
          <Textarea id="notes" value={customerInfo.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button variant="outline" onClick={onBack} size="lg">
          {t.booking.back}
        </Button>
        <Button onClick={handleContinue} size="lg">
          {t.booking.next}
        </Button>
      </div>
    </div>
  )
}
