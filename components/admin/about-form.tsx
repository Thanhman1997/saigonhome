"use client"

import { useActionState, useState } from "react"
import { useAdminAutosave } from "@/hooks/use-admin-autosave"
import { updateAboutContent } from "@/app/actions/about"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type About = {
  titleEn: string
  titleKo: string
  titleVi: string
  bodyEn: string[]
  bodyKo: string[]
  bodyVi: string[]
  imageUrl: string | null
  visible: boolean
}

export function AboutForm({ about }: { about: About }) {
  const [state, action, pending] = useActionState(updateAboutContent, undefined)
  const [imageUrl, setImageUrl] = useState<string | null>(about.imageUrl)
  const [draftValues, setDraftValues] = useState<Record<string, string>>({})
  const autosaveStatus = useAdminAutosave("about", "all", draftValues)

  return (
    <form action={action} onChange={(event) => setDraftValues(Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>)} className="flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <input id="visible" name="visible" type="checkbox" defaultChecked={about.visible} className="size-4" />
        <Label htmlFor="visible" className="text-sm font-medium">
          Show the About / Philosophy section on the public site
        </Label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="titleEn">Title (English)</Label>
          <Input id="titleEn" name="titleEn" defaultValue={about.titleEn} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="titleKo">Title (Korean)</Label>
          <Input id="titleKo" name="titleKo" defaultValue={about.titleKo} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="titleVi">Title (Vietnamese)</Label>
          <Input id="titleVi" name="titleVi" defaultValue={about.titleVi} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bodyEn">Body paragraphs (English, one per line)</Label>
          <Textarea id="bodyEn" name="bodyEn" defaultValue={about.bodyEn.join("\n")} rows={6} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bodyKo">Body paragraphs (Korean, one per line)</Label>
          <Textarea id="bodyKo" name="bodyKo" defaultValue={about.bodyKo.join("\n")} rows={6} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bodyVi">Body paragraphs (Vietnamese, one per line)</Label>
          <Textarea id="bodyVi" name="bodyVi" defaultValue={about.bodyVi.join("\n")} rows={6} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Philosophy image (optional)</Label>
        <ImageUpload label="Philosophy image" name="imageUrl" value={imageUrl} onChange={setImageUrl} aspect="aspect-video" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save about content"}
      </Button>
    </form>
  )
}
