"use client"

import { useActionState, useCallback, useEffect, useRef, useState } from "react"
import { AdminDraftRecoveryBanner } from "@/components/admin/admin-draft-recovery-banner"
import { useAdminAutosave } from "@/hooks/use-admin-autosave"
import { updateHero } from "@/app/actions/hero"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"

type Hero = {
  kickerEn: string; kickerKo: string; kickerVi: string; titleLine1En: string; titleLine1Ko: string; titleLine1Vi: string; titleLine2En: string; titleLine2Ko: string; titleLine2Vi: string; subtitleEn: string; subtitleKo: string; subtitleVi: string; ctaEn: string; ctaKo: string; ctaVi: string; imageUrl: string; visible: boolean
}

export function HeroForm({ hero }: { hero: Hero }) {
  const [state, action, pending] = useActionState(updateHero, undefined)
  const [imageUrl, setImageUrl] = useState<string | null>(hero.imageUrl)
  const formRef = useRef<HTMLFormElement>(null)
  const [draftValues, setDraftValues] = useState<Record<string, unknown>>({})
  const applyDraft = useCallback((values: Record<string, unknown>) => {
    const form = formRef.current
    if (!form) return
    Object.entries(values).forEach(([name, value]) => { const field = form.elements.namedItem(name) as HTMLInputElement | null; if (field) { if (field.type === "checkbox") field.checked = Boolean(value); else field.value = String(value ?? "") } })
    if (typeof values.imageUrl === "string") setImageUrl(values.imageUrl)
  }, [])
  const autosave = useAdminAutosave("hero", "all", draftValues, { onRestore: applyDraft })
  const { discard } = autosave
  useEffect(() => { if (state && !state.error) void discard() }, [state, discard])
  const field = (name: keyof Hero, label: string, lang: string, type = "text") => (
    <label className="flex flex-col gap-1 text-sm"><span className="font-medium">{label} <span className="text-muted-foreground">({lang})</span></span><input name={name} defaultValue={hero[name] as string} type={type} className="border border-input bg-background px-3 py-2" /></label>
  )
  return <form ref={formRef} action={action} onChange={(event) => { const form = event.currentTarget; setDraftValues(Object.fromEntries(new FormData(form).entries())) }} className="flex flex-col gap-6">
    <AdminDraftRecoveryBanner savedAt={autosave.savedAt} onDiscard={autosave.discard} />
    <div className="flex items-center gap-3 border-b border-border pb-4"><input id="visible" name="visible" type="checkbox" defaultChecked={hero.visible} className="size-4" /><label htmlFor="visible" className="text-sm font-medium">Show hero text and CTA overlay</label></div>
    <div className="grid gap-4 md:grid-cols-3">{field("kickerEn", "Kicker", "EN")}{field("kickerKo", "Kicker", "KO")}{field("kickerVi", "Kicker", "VI")}{field("titleLine1En", "Title line 1", "EN")}{field("titleLine1Ko", "Title line 1", "KO")}{field("titleLine1Vi", "Title line 1", "VI")}{field("titleLine2En", "Title line 2", "EN")}{field("titleLine2Ko", "Title line 2", "KO")}{field("titleLine2Vi", "Title line 2", "VI")}{field("subtitleEn", "Subtitle", "EN")}{field("subtitleKo", "Subtitle", "KO")}{field("subtitleVi", "Subtitle", "VI")}{field("ctaEn", "CTA", "EN")}{field("ctaKo", "CTA", "KO")}{field("ctaVi", "CTA", "VI")}</div>
    <div className="flex flex-col gap-2"><span className="text-sm font-medium">Hero image</span><ImageUpload label="Hero image" name="imageUrl" value={imageUrl} onChange={setImageUrl} aspect="aspect-[16/9]" /></div>
    {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    <div className="flex flex-wrap items-center gap-3"><span className="text-sm text-muted-foreground" aria-live="polite">{autosave.status === "saving" ? "Saving..." : autosave.status === "saved" ? "Saved ✓" : autosave.status === "error" ? "Draft save failed" : ""}</span>
      <Button type="submit" name="publish" value="publish" disabled={pending}>{pending ? "Saving…" : "Publish changes"}</Button>
      <Button type="submit" name="publish" value="draft" variant="outline" disabled={pending}>Save as draft</Button>
      <a href="/admin/preview" className="text-sm font-medium text-primary hover:underline">Open protected preview</a>
    </div>
  </form>
}
