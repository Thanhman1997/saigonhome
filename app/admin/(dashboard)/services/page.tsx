import Image from "next/image"
import { getAllServicesAdmin } from "@/lib/admin-data"
import { ServiceFormDialog } from "@/components/admin/service-form-dialog"
import { ServiceRowControls } from "@/components/admin/service-row-controls"
import { formatVnd } from "@/lib/pricing"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Services" }

export default async function AdminServicesPage() {
  const services = await getAllServicesAdmin()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground">
            {services.length} service{services.length === 1 ? "" : "s"} · multilingual copy, imagery, durations, and pricing
          </p>
        </div>
        <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/admin/services/content">Edit section content</Link></Button><ServiceFormDialog /></div>
      </div>

      <div className="flex flex-col gap-3">
        {services.map((service, idx) => (
          <div
            key={service.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex flex-1 gap-4">
              {service.imageUrl ? (
                <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-md sm:block">
                  <Image src={service.imageUrl} alt="" fill className="object-cover" />
                </div>
              ) : (
                <div className="hidden h-16 w-24 shrink-0 items-center justify-center rounded-md bg-muted text-2xl sm:flex">
                  {service.icon}
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{service.nameEn}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{service.nameKo}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{service.nameVi}</span>
                </div>
                <p className="text-sm text-muted-foreground">{service.descEn}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {service.durations.map((d) => (
                    <span key={d.minutes} className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                      {d.minutes} min · {formatVnd(d.priceVnd)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ServiceRowControls
                serviceId={service.id}
                active={service.active}
                canMoveUp={idx > 0}
                canMoveDown={idx < services.length - 1}
              />
              <ServiceFormDialog service={service} />
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-muted-foreground">
            No services yet. Create your first one.
          </div>
        )}
      </div>
    </div>
  )
}
