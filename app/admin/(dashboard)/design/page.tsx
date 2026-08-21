import { getDesignSettingsAdmin } from "@/lib/admin-data"
import { DesignSettingsForm } from "@/components/admin/design-settings-form"
import { DESIGN_PRESETS } from "@/lib/design-tokens"

export default async function AdminDesignPage() {
  const settings = await getDesignSettingsAdmin()
  const initial = settings ?? DESIGN_PRESETS[0].values

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Design Settings</h1>
        <p className="text-sm text-muted-foreground">
          Adjust the site&apos;s fonts, colors, and component shapes. Changes apply site-wide once saved.
        </p>
      </div>
      <DesignSettingsForm initial={initial} />
    </div>
  )
}
