import { db } from "@/lib/db"
import { serviceAreas } from "@/lib/db/schema"
import { asc } from "drizzle-orm"
import { formatVnd } from "@/lib/pricing"

export default async function ServiceAreasPage() {
  const areas = await db.select().from(serviceAreas).orderBy(asc(serviceAreas.nameEn))
  return (
    <section className="space-y-6">
      <div><p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Operations</p><h1 className="mt-2 font-serif text-3xl text-foreground">Service areas</h1><p className="mt-2 text-sm text-muted-foreground">Manage active locations, travel fees, and expected travel time.</p></div>
      <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Area</th><th className="px-4 py-3">Vietnamese</th><th className="px-4 py-3">Korean</th><th className="px-4 py-3">Surcharge</th><th className="px-4 py-3">Travel</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-border">{areas.map((area) => <tr key={area.id}><td className="px-4 py-4 font-medium">{area.nameEn}</td><td className="px-4 py-4">{area.nameVi}</td><td className="px-4 py-4">{area.nameKo}</td><td className="px-4 py-4">{formatVnd(area.defaultSurchargeVnd)}</td><td className="px-4 py-4">{area.defaultTravelMinutes} min</td><td className="px-4 py-4"><span className={area.active ? "text-emerald-600" : "text-muted-foreground"}>{area.active ? "Active" : "Inactive"}</span></td></tr>)}</tbody></table></div>{!areas.length && <p className="px-4 py-12 text-center text-sm text-muted-foreground">No service areas configured.</p>}</div>
    </section>
  )
}
