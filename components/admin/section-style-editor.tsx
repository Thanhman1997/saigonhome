"use client"

import { useActionState } from "react"
import { updateSectionStyle } from "@/app/actions/section-styles"
import { FONT_OPTIONS } from "@/lib/design-tokens"

const sections = ["hero", "services", "about", "experts", "promotions", "membership", "reviews", "faq", "contact"]

export type SectionStyleRecord = {
  sectionKey: string
  titleFont?: string | null
  bodyFont?: string | null
}

function FontSelect({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <select name={name} defaultValue={defaultValue} className="mt-1 w-full rounded-md border bg-background p-2 text-foreground">
      <option value="inherit">Default (inherit)</option>
      <optgroup label="Serif">
        {FONT_OPTIONS.filter((f) => f.category === "serif").map((f) => (
          <option key={f.key} value={f.key}>{f.label}</option>
        ))}
      </optgroup>
      <optgroup label="Sans-serif">
        {FONT_OPTIONS.filter((f) => f.category === "sans").map((f) => (
          <option key={f.key} value={f.key}>{f.label}</option>
        ))}
      </optgroup>
    </select>
  )
}

export function SectionStyleEditor({ initialStyles = [] }: { initialStyles?: SectionStyleRecord[] }) {
  const stylesByKey = new Map(initialStyles.map((s) => [s.sectionKey, s]))
  const [state, action, pending] = useActionState(async (_: { ok: boolean; error?: string }, formData: FormData) => {
    try { await updateSectionStyle(formData); return { ok: true } } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to save" } }
  }, { ok: false })
  return <div className="space-y-6">
    {sections.map((section) => {
      const saved = stylesByKey.get(section)
      return <form key={section} action={action} className="grid gap-4 rounded-xl border border-border p-5 md:grid-cols-5">
      <legend className="px-2 font-semibold capitalize text-foreground">{section}</legend>
      <input type="hidden" name="sectionKey" value={section} />
      <label className="text-sm text-muted-foreground">Heading font<FontSelect name="headingFont" defaultValue={saved?.titleFont ?? "inherit"} /></label>
      <label className="text-sm text-muted-foreground">Heading size<input name="headingSize" defaultValue="inherit" placeholder="2.5rem" className="mt-1 w-full rounded-md border bg-background p-2 text-foreground" /></label>
      <label className="text-sm text-muted-foreground">Heading color<input name="headingColor" type="color" defaultValue="#c65d24" className="mt-1 h-10 w-full rounded-md border bg-background p-1" /></label>
      <label className="text-sm text-muted-foreground">Heading align<select name="headingAlign" defaultValue="center" className="mt-1 w-full rounded-md border bg-background p-2 text-foreground"><option>left</option><option>center</option><option>right</option></select></label>
      <label className="text-sm text-muted-foreground">Body font<FontSelect name="bodyFont" defaultValue={saved?.bodyFont ?? "inherit"} /></label>
      <label className="text-sm text-muted-foreground">Body size<input name="bodySize" defaultValue="inherit" placeholder="1rem" className="mt-1 w-full rounded-md border bg-background p-2 text-foreground" /></label>
      <label className="text-sm text-muted-foreground">Body color<input name="bodyColor" type="color" defaultValue="#6b6255" className="mt-1 h-10 w-full rounded-md border bg-background p-1" /></label>
      <label className="text-sm text-muted-foreground">Body align<select name="bodyAlign" defaultValue="center" className="mt-1 w-full rounded-md border bg-background p-2 text-foreground"><option>left</option><option>center</option><option>right</option></select></label>
      <button disabled={pending} className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">{pending ? "Saving…" : `Save ${section}`}</button>
    </form>
    })}
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state.ok && <p className="text-sm text-primary">Saved successfully.</p>}
  </div>
}
