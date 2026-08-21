import { getAllMembershipPlansAdmin } from "@/lib/admin-data"
import { MembershipFormDialog } from "@/components/admin/membership-form-dialog"
import { MembershipRowControls } from "@/components/admin/membership-row-controls"
import { formatVnd } from "@/lib/pricing"

export const metadata = { title: "Membership" }

export default async function AdminMembershipPage() {
  const plans = await getAllMembershipPlansAdmin()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Membership plans</h1>
          <p className="text-sm text-muted-foreground">
            {plans.length} plan{plans.length === 1 ? "" : "s"} · prepaid balance plans shown on the public site
          </p>
        </div>
        <MembershipFormDialog />
      </div>

      <div className="flex flex-col gap-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{plan.nameEn}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{plan.nameKo}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{plan.nameVi}</span>
              </div>
              <p className="text-sm text-muted-foreground">{plan.descriptionEn}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-foreground">{formatVnd(plan.priceVnd)}</span>
                <span className="text-muted-foreground">bonus +{formatVnd(plan.bonusVnd)}</span>
                {plan.validityDays && <span className="text-muted-foreground">valid {plan.validityDays} days</span>}
              </div>
              {plan.benefits.length > 0 && (
                <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                  {plan.benefits.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-1">
              <MembershipRowControls planId={plan.id} active={plan.active} />
              <MembershipFormDialog plan={plan} />
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-muted-foreground">
            No membership plans yet. Create your first one.
          </div>
        )}
      </div>
    </div>
  )
}
