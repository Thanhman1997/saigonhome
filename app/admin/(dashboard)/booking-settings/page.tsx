import { getBookingSettingsAdmin } from "@/lib/admin-data"
import { BookingSettingsForm } from "@/components/admin/booking-settings-form"

export const metadata = { title: "Booking Settings" }

export default async function AdminBookingSettingsPage() {
  const settings = await getBookingSettingsAdmin()

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Booking Settings</h1>
        <p className="text-sm text-muted-foreground">
          Control how far ahead customers can book, minimum notice, working hours, closed days, and discount rates.
        </p>
      </div>
      <BookingSettingsForm settings={settings} />
    </div>
  )
}
