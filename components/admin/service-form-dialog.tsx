"use client"

import { useActionState, useEffect, useState } from "react"
import { useAdminAutosave } from "@/hooks/use-admin-autosave"
import { useFormStatus } from "react-dom"
import { Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ImageUpload } from "@/components/admin/image-upload"
import { createService, updateService } from "@/app/actions/services"

type ServiceRow = {
  id: number
  nameEn: string
  nameKo: string
  nameVi: string
  descEn: string
  descKo: string
  descVi: string
  icon: string
  imageUrl: string | null
  durations: { minutes: number; priceVnd: number }[]
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  )
}

export function ServiceFormDialog({ service }: { service?: ServiceRow }) {
  const [open, setOpen] = useState(false)
  const action = service ? updateService.bind(null, service.id) : createService
  const [state, formAction] = useActionState(action, undefined)
  const [imageUrl, setImageUrl] = useState<string | null>(service?.imageUrl ?? null)

  useEffect(() => {
    if (state && !state.error) {
      setOpen(false)
    }
  }, [state])

  const durationsDefault = service?.durations.map((d) => `${d.minutes}, ${d.priceVnd}`).join("\n") ?? "60, 300000\n90, 450000"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {service ? (
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
            <Pencil className="size-4" />
            <span className="sr-only">Edit service</span>
          </Button>
        ) : (
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            New service
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{service ? "Edit service" : "Create a service"}</DialogTitle>
          <DialogDescription>Multilingual copy, imagery, and duration/pricing options.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameEn">Name (English)</Label>
              <Input id="nameEn" name="nameEn" defaultValue={service?.nameEn} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameKo">Name (Korean)</Label>
              <Input id="nameKo" name="nameKo" defaultValue={service?.nameKo} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameVi">Name (Vietnamese)</Label>
              <Input id="nameVi" name="nameVi" defaultValue={service?.nameVi} required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descEn">Description (English)</Label>
              <Textarea id="descEn" name="descEn" defaultValue={service?.descEn} required rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descKo">Description (Korean)</Label>
              <Textarea id="descKo" name="descKo" defaultValue={service?.descKo} required rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descVi">Description (Vietnamese)</Label>
              <Textarea id="descVi" name="descVi" defaultValue={service?.descVi} required rows={3} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="icon">Icon (emoji fallback shown without an image)</Label>
              <Input id="icon" name="icon" defaultValue={service?.icon ?? "💆"} maxLength={4} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="durations">Durations &amp; pricing (one per line: minutes, price VND)</Label>
              <Textarea id="durations" name="durations" defaultValue={durationsDefault} rows={4} />
            </div>
          </div>

          <ImageUpload label="Service image" name="imageUrl" value={imageUrl} onChange={setImageUrl} aspect="aspect-video" />

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <SubmitButton label={service ? "Save changes" : "Create service"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
