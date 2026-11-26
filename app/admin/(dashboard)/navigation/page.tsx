import { getNavigationSettingsAdmin } from "@/lib/admin-data"
import { NavigationSettingsForm, type NavigationItem } from "@/components/admin/navigation-settings-form"

export const metadata = { title: "Navigation Menu" }

export default async function AdminNavigationPage() {
  const settings = await getNavigationSettingsAdmin()
  return <div className="flex max-w-6xl flex-col gap-6"><div><h1 className="text-2xl font-semibold text-foreground">Navigation Menu</h1><p className="text-sm text-muted-foreground">Edit menu labels, anchors, visibility, typography, and colors. Changes are saved to the database.</p></div><NavigationSettingsForm initial={settings as NavigationItem[]} /></div>
}
