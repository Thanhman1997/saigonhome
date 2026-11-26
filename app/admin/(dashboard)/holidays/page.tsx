import { getHolidays } from "@/app/actions/holidays"
import { HolidaySyncForm } from "@/components/admin/holiday-sync-form"
import { HolidayVerification } from "@/components/admin/holiday-verification"

export const metadata = { title: "Vietnam holidays" }

export default async function HolidaysPage() {
  const year = new Date().getFullYear()
  const holidays = await getHolidays(year)
  return <div className="flex flex-col gap-6">
    <div><h1 className="text-2xl font-semibold">Vietnam public holidays</h1><p className="text-sm text-muted-foreground">Sync official holiday dates from Nager.Date, then verify them before creating seasonal promotions.</p></div>
    <HolidaySyncForm year={year} />
    <div className="flex flex-col gap-2">{holidays.map((holiday) => <div key={holiday.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"><div><p className="font-medium">{holiday.date} · {holiday.localName}</p><p className="text-sm text-muted-foreground">{holiday.englishName} · {holiday.fixedDate ? "Fixed date" : "Observed / movable date"}</p></div><HolidayVerification id={holiday.id} verified={holiday.verified} /></div>)}{holidays.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">No holidays synced for {year}. Use the sync button above.</div>}</div>
  </div>
}
