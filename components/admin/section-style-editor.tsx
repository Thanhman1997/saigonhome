"use client"

import { useActionState } from "react"
import { updateSectionStyle } from "@/app/actions/section-styles"
import { FONT_OPTIONS } from "@/lib/design-tokens"

type SectionStyle = {
  sectionKey: string
  titleFont: string
  titleSize: string
  titleColor: string | null
  titleAlign: string
  bodyFont: string
  bodySize: string
  bodyColor: string | null
  bodyAlign: string
}

const sections = ["hero", "services", "about", "experts", "promotions", "membership", "reviews", "faq", "contact"]
const HEADING_SIZES = [
  { value: "inherit", label: "Inherit" },
  { value: "1.5rem", label: "1.5 rem" },
  { value: "1.75rem", label: "1.75 rem" },
  { value: "2rem", label: "2 rem" },
  { value: "2.5rem", label: "2.5 rem" },
  { value: "3rem", label: "3 rem" },
]
const BODY_SIZES = [
  { value: "inherit", label: "Inherit" },
  { value: "0.875rem", label: "Compact" },
  { value: "1rem", label: "Standard" },
  { value: "1.125rem", label: "Comfortable" },
  { value: "1.25rem", label: "Large" },
  { value: "1.5rem", label: "Extra large" },
]
const ALIGNMENTS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
]
const FIELD_CLASS = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function legacySize(value: string, kind: "heading" | "body") {
  const oldValues = kind === "heading"
    ? { sm: "1.5rem", md: "2rem", lg: "3rem" }
    : { sm: "0.875rem", md: "1rem", lg: "1.25rem" }
  return value in oldValues ? oldValues[value as keyof typeof oldValues] : value
}

export function SectionStyleEditor({ styles }: { styles: SectionStyle[] }) {
  const [state, action, pending] = useActionState(async (_: { ok: boolean; error?: string }, formData: FormData) => {
    try {
      await updateSectionStyle(formData)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Unable to save" }
    }
  }, { ok: false })
  const styleByKey = new Map(styles.map((style) => [style.sectionKey, style]))

  return <div className="flex flex-col gap-6">
    {sections.map((section) => {
      const saved = styleByKey.get(section)
      const headingSize = legacySize(saved?.titleSize ?? "inherit", "heading")
      const bodySize = legacySize(saved?.bodySize ?? "inherit", "body")

      return <form key={section} action={action} className="grid gap-4 rounded-xl border border-border p-5 md:grid-cols-5">
        <input type="hidden" name="sectionKey" value={section} />
        <div className="md:col-span-5">
          <h2 className="font-serif text-lg font-semibold capitalize text-foreground">{section}</h2>
        </div>

        <label className="text-sm text-muted-foreground">
          Heading font
          <select name="headingFont" defaultValue={saved?.titleFont ?? "inherit"} className={FIELD_CLASS}>
            <option value="inherit">Use site heading font</option>
            {FONT_OPTIONS.map((font) => <option key={font.key} value={font.key}>{font.label}</option>)}
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Heading size
          <select name="headingSize" defaultValue={headingSize} className={FIELD_CLASS}>
            {HEADING_SIZES.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Heading color
          <input name="headingColor" type="color" defaultValue={saved?.titleColor ?? "#c65d24"} className="mt-1 h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1" />
        </label>
        <label className="text-sm text-muted-foreground">
          Heading align
          <select name="headingAlign" defaultValue={saved?.titleAlign ?? "center"} className={FIELD_CLASS}>
            {ALIGNMENTS.map((alignment) => <option key={alignment.value} value={alignment.value}>{alignment.label}</option>)}
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Body font
          <select name="bodyFont" defaultValue={saved?.bodyFont ?? "inherit"} className={FIELD_CLASS}>
            <option value="inherit">Use site body font</option>
            {FONT_OPTIONS.map((font) => <option key={font.key} value={font.key}>{font.label}</option>)}
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Body size
          <select name="bodySize" defaultValue={bodySize} className={FIELD_CLASS}>
            {BODY_SIZES.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Body color
          <input name="bodyColor" type="color" defaultValue={saved?.bodyColor ?? "#6b6255"} className="mt-1 h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1" />
        </label>
        <label className="text-sm text-muted-foreground">
          Body align
          <select name="bodyAlign" defaultValue={saved?.bodyAlign ?? "center"} className={FIELD_CLASS}>
            {ALIGNMENTS.map((alignment) => <option key={alignment.value} value={alignment.value}>{alignment.label}</option>)}
          </select>
        </label>
        <div className="flex items-end">
          <button disabled={pending} className="w-full rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
            {pending ? "Saving…" : `Save ${section}`}
          </button>
        </div>
      </form>
    })}
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state.ok && <p role="status" className="text-sm text-primary">Saved successfully.</p>}
  </div>
}
