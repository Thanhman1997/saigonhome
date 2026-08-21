import Image from "next/image"
import { getAllEventsAdmin } from "@/lib/admin-data"
import { PromotionFormDialog } from "@/components/admin/promotion-form-dialog"
import { PromotionRowControls } from "@/components/admin/promotion-row-controls"

export const metadata = { title: "Promotions" }

const TYPE_LABELS: Record<string, string> = {
  first_time: "First-time customer",
  combo: "Combo / group",
  seasonal: "Seasonal event",
}

export default async function AdminPromotionsPage() {
  const promotions = await getAllEventsAdmin()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Promotions</h1>
          <p className="text-sm text-muted-foreground">
            {promotions.length} promotion{promotions.length === 1 ? "" : "s"} · first-time, combo, and seasonal offers all
            live here
          </p>
        </div>
        <PromotionFormDialog />
      </div>

      <div className="flex flex-col gap-3">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex flex-1 gap-4">
              {promo.imageUrl && (
                <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-md sm:block">
                  <Image src={promo.imageUrl} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{promo.nameEn}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {TYPE_LABELS[promo.type] ?? promo.type}
                  </span>
                  {promo.discountLabel && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {promo.discountLabel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{promo.descEn}</p>
                {promo.type === "seasonal" && promo.startDate && promo.endDate && (
                  <span className="text-xs text-muted-foreground">
                    {promo.startDate} → {promo.endDate}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <PromotionRowControls promotionId={promo.id} active={promo.active} />
              <PromotionFormDialog promotion={promo} />
            </div>
          </div>
        ))}
        {promotions.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-muted-foreground">
            No promotions yet. Create your first one.
          </div>
        )}
      </div>
    </div>
  )
}
