"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateBookingSettings } from "@/app/actions/booking-settings"

type BookingSettingsRow = {
  id: number
  advanceBookingDays: number
  minNoticeHours: number
  maxGuests: number
  openTime: string
  closeTime: string
  closedWeekdays: number[]
  groupDiscount2: string
  groupDiscount3: string
  groupDiscount4: string
  firstTimeDiscount: string
} | null

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save booking settings"}
    </Button>
  )
}

export function BookingSettingsForm({ settings }: { settings: BookingSettingsRow }) {
  const [state, formAction] = useActionState(updateBookingSettings, undefined)
  const closed = new Set(settings?.closedWeekdays ?? [])
  const toPercent = (v?: string) => (v ? Math.round(Number(v) * 100) : 0)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {settings?.id && <input type="hidden" name="id" value={settings.id} />}

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-foreground">Availability window</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="advanceBookingDays">Advance booking (days)</Label>
            <Input
              id="advanceBookingDays"
              name="advanceBookingDays"
              type="number"
              min={1}
              max={365}
              defaultValue={settings?.advanceBookingDays ?? 30}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minNoticeHours">Minimum notice (hours)</Label>
            <Input
              id="minNoticeHours"
              name="minNoticeHours"
              type="number"
              min={0}
              max={168}
              defaultValue={settings?.minNoticeHours ?? 2}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maxGuests">Max guests per booking</Label>
            <Input
              id="maxGuests"
              name="maxGuests"
              type="number"
              min={1}
              max={50}
              defaultValue={settings?.maxGuests ?? 20}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="openTime">Opening time</Label>
            <Input id="openTime" name="openTime" type="time" defaultValue={settings?.openTime ?? "09:00"} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="closeTime">Closing time</Label>
            <Input id="closeTime" name="closeTime" type="time" defaultValue={settings?.closeTime ?? "21:00"} required />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Closed weekdays</Label>
          <div className="flex flex-wrap gap-4">
            {WEEKDAY_LABELS.map((label, idx) => (
              <label key={idx} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  name={`closedWeekday_${idx}`}
                  defaultChecked={closed.has(idx)}
                  className="size-4 rounded border-input accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-foreground">Discount rates (%)</h3>
        <p className="text-xs text-muted-foreground">
          Group discounts apply automatically based on party size. First-time discount applies when the customer marks
          themselves as a new customer. The higher of the two is applied — they do not stack.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="groupDiscount2">2 guests</Label>
            <Input
              id="groupDiscount2"
              name="groupDiscount2"
              type="number"
              min={0}
              max={100}
              step={0.5}
              defaultValue={toPercent(settings?.groupDiscount2)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="groupDiscount3">3 guests</Label>
            <Input
              id="groupDiscount3"
              name="groupDiscount3"
              type="number"
              min={0}
              max={100}
              step={0.5}
              defaultValue={toPercent(settings?.groupDiscount3)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="groupDiscount4">4+ guests</Label>
            <Input
              id="groupDiscount4"
              name="groupDiscount4"
              type="number"
              min={0}
              max={100}
              step={0.5}
              defaultValue={toPercent(settings?.groupDiscount4)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstTimeDiscount">First-time</Label>
            <Input
              id="firstTimeDiscount"
              name="firstTimeDiscount"
              type="number"
              min={0}
              max={100}
              step={0.5}
              defaultValue={toPercent(settings?.firstTimeDiscount)}
              required
            />
          </div>
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div>
        <SubmitButton />
      </div>
    </form>
  )
}
