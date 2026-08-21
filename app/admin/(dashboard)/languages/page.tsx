import { getDefaultLocaleAdmin } from "@/lib/admin-data"
import { LanguagesForm } from "@/components/admin/languages-form"

export const metadata = { title: "Languages" }

export default async function AdminLanguagesPage() {
  const defaultLocale = await getDefaultLocaleAdmin()

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Languages</h1>
        <p className="text-sm text-muted-foreground">
          Lotus Wellness supports English, Korean, and Vietnamese across the entire site — every service, therapist,
          FAQ, and content field already has translations for all three.
        </p>
      </div>
      <LanguagesForm defaultLocale={defaultLocale} />
    </div>
  )
}
