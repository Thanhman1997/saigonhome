import { db } from "@/lib/db"
import { siteContent } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { saveBookingEmailTemplate } from "@/app/actions/admin"

const defaults = {
  confirmed: { subject: "Booking confirmed — {{reference}}", body: "Hello {{customerName}},\nYour booking has been confirmed.\n\nPayment options:\n1. Pay directly at the spa or by bank transfer.\n2. Pay by Visa or Mastercard: {{paymentUrl}}\n\nService: {{service}} ({{duration}} min)\nDate & time: {{date}} at {{time}}" },
  cancelled: { subject: "Booking update — {{reference}}", body: "Hello {{customerName}},\nUnfortunately, we cannot confirm this booking. Please contact us to choose another time." },
}

async function TemplateForm({ kind }: { kind: "confirmed" | "cancelled" }) {
  const [row] = await db.select().from(siteContent).where(eq(siteContent.key, `booking_${kind}_email`)).limit(1)
  const [subject, ...bodyLines] = (row?.valueEn || `${defaults[kind].subject}\n${defaults[kind].body}`).split("\n")
  return <form action={saveBookingEmailTemplate} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"><input type="hidden" name="kind" value={kind} /><label className="flex flex-col gap-2 text-sm font-medium">Email subject<input name="subject" defaultValue={subject} className="rounded-md border border-input bg-background px-3 py-2 font-normal" /></label><label className="flex flex-col gap-2 text-sm font-medium">Email content<textarea name="body" defaultValue={bodyLines.join("\n")} rows={9} className="rounded-md border border-input bg-background px-3 py-2 font-normal leading-6" /></label><p className="text-xs leading-5 text-muted-foreground">{"Variables: {{customerName}}, {{reference}}, {{paymentUrl}}, {{service}}, {{duration}}, {{date}}, {{time}}"}</p><button type="submit" className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save template</button></form>
}

export default function EmailTemplatesPage() { return <section className="flex flex-col gap-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Settings</p><h1 className="mt-2 font-serif text-4xl">Booking emails</h1><p className="mt-2 max-w-2xl leading-6 text-muted-foreground">Edit the subject and content sent after a booking is confirmed or cancelled.</p></div><div className="grid gap-6 lg:grid-cols-2"><TemplateForm kind="confirmed" /><TemplateForm kind="cancelled" /></div></section> }
