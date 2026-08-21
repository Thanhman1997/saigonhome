"use client"

import { useActionState, useState } from "react"
import { updateHero } from "@/app/actions/hero"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"

type Hero = {
  kickerEn: string; kickerKo: string; kickerVi: string; titleLine1En: string; titleLine1Ko: string; titleLine1Vi: string; titleLine2En: string; titleLine2Ko: string; titleLine2Vi: string; subtitleEn: string; subtitleKo: string; subtitleVi: string; ctaEn: string; ctaKo: string; ctaVi: string; imageUrl: string; visible: boolean
}

export function HeroForm({ hero }: { hero: Hero }) {
  const [state, action, pending] = useActionState(updateHero, undefined)
  const [imageUrl, setImageUrl] = useState<string | null>(hero.imageUrl)
  const field = (name: keyof Hero, label: string, lang: string, type = "text") => (
    <label className="flex flex-col gap-1 text-sm"><span className="font-medium">{label} <span className="text-muted-foreground">({lang})</span></span><input name={name} defaultValue={hero[name] as string} type={type} className="border border-input bg-background px-3 py-2" /></label>
  )
  return <form action={action} className="flex flex-col gap-6">
    <div className="flex items-center gap-3 border-b border-border pb-4"><input id="visible" name="visible" type="checkbox" defaultChecked={hero.visible} className="size-4" /><label htmlFor="visible" className="text-sm font-medium">Show hero text and CTA overlay</label></div>
    <div className="grid gap-4 md:grid-cols-3">{field("kickerEn", "Kicker", "EN")}{field("kickerKo", "Kicker", "KO")}{field("kickerVi", "Kicker", "VI")}{field("titleLine1En", "Title line 1", "EN")}{field("titleLine1Ko", "Title line 1", "KO")}{field("titleLine1Vi", "Title line 1", "VI")}{field("titleLine2En", "Title line 2", "EN")}{field("titleLine2Ko", "Title line 2", "KO")}{field("titleLine2Vi", "Title line 2", "VI")}{field("subtitleEn", "Subtitle", "EN")}{field("subtitleKo", "Subtitle", "KO")}{field("subtitleVi", "Subtitle", "VI")}{field("ctaEn", "CTA", "EN")}{field("ctaKo", "CTA", "KO")}{field("ctaVi", "CTA", "VI")}</div>
    <div className="flex flex-col gap-2"><span className="text-sm font-medium">Hero image</span><ImageUpload label="Hero image" name="imageUrl" value={imageUrl} onChange={setImageUrl} aspect="aspect-[16/9]" /></div>
    {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" name="publish" value="publish" disabled={pending}>{pending ? "Saving…" : "Publish changes"}</Button>
      <Button type="submit" name="publish" value="draft" variant="outline" disabled={pending}>Save as draft</Button>
      <a href="/admin/preview" className="text-sm font-medium text-primary hover:underline">Open protected preview</a>
    </div>
  </form>
}
