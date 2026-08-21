import { getAboutContentAdmin, getAllLotusValuesAdmin } from "@/lib/admin-data"
import { AboutForm } from "@/components/admin/about-form"
import { LotusValueFormDialog } from "@/components/admin/lotus-value-form-dialog"
import { LotusValueRowControls } from "@/components/admin/lotus-value-row-controls"

export const metadata = { title: "About" }

const DEFAULT_ABOUT = {
  titleEn: "",
  titleKo: "",
  titleVi: "",
  bodyEn: [] as string[],
  bodyKo: [] as string[],
  bodyVi: [] as string[],
  imageUrl: null as string | null,
  visible: true,
}

export default async function AdminAboutPage() {
  const [about, values] = await Promise.all([getAboutContentAdmin(), getAllLotusValuesAdmin()])

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">About / Philosophy</h1>
        <p className="text-sm text-muted-foreground">The philosophy statement shown near the top of the public site.</p>
        <div className="mt-6">
          <AboutForm about={about ?? DEFAULT_ABOUT} />
        </div>
      </div>

      <div className="border-t border-border pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Guiding values</h2>
            <p className="text-sm text-muted-foreground">The four (or more) value cards shown below the philosophy text.</p>
          </div>
          <LotusValueFormDialog />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {values.map((value, idx) => (
            <div
              key={value.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{value.textEn}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{value.textKo}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{value.textVi}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{value.icon}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <LotusValueRowControls
                  valueId={value.id}
                  active={value.active}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < values.length - 1}
                />
                <LotusValueFormDialog value={value} />
              </div>
            </div>
          ))}
          {values.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-muted-foreground">
              No guiding values yet. Add your first one.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
