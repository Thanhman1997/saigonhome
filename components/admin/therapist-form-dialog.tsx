"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { Pencil } from "lucide-react"
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
import { updateTherapist } from "@/app/actions/therapists"

type TherapistRow = {
  id: number
  code: string
  age: number | null
  heightCm: number | null
  weightKg: number | null
  experienceYears: number | null
  locationEn: string | null
  locationKo: string | null
  locationVi: string | null
  languages: string | null
  bioEn: string | null
  bioKo: string | null
  bioVi: string | null
  photoUrl: string | null
  status: string
  maxBookingsPerDay: number
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  )
}

export function TherapistFormDialog({ therapist }: { therapist: TherapistRow }) {
  const [open, setOpen] = useState(false)
  const action = updateTherapist.bind(null, therapist.id)
  const [state, formAction] = useActionState(action, undefined)
  const [photoUrl, setPhotoUrl] = useState<string | null>(therapist.photoUrl)

  useEffect(() => {
    if (state && !state.error) {
      setOpen(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
          <Pencil className="size-4" />
          <span className="sr-only">Edit therapist</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit therapist {therapist.code}</DialogTitle>
          <DialogDescription>Update profile details and photo shown on the public site.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <ImageUpload label="Photo" name="photoUrl" value={photoUrl} onChange={setPhotoUrl} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Publishing status</Label>
              <select id="status" name="status" defaultValue={therapist.status} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="draft">Draft</option>
                <option value="active">Active / public</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maxBookingsPerDay">Daily booking limit</Label>
              <Input id="maxBookingsPerDay" name="maxBookingsPerDay" type="number" min="1" defaultValue={therapist.maxBookingsPerDay ?? 4} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" defaultValue={therapist.code} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" defaultValue={therapist.age ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="heightCm">Height (cm)</Label>
              <Input id="heightCm" name="heightCm" type="number" defaultValue={therapist.heightCm ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="weightKg">Weight (kg)</Label>
              <Input id="weightKg" name="weightKg" type="number" defaultValue={therapist.weightKg ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="experienceYears">Experience (years)</Label>
              <Input id="experienceYears" name="experienceYears" type="number" defaultValue={therapist.experienceYears ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="languages">Languages</Label>
              <Input id="languages" name="languages" defaultValue={therapist.languages ?? ""} placeholder="EN, KO, VI" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="locationEn">Location (English)</Label>
              <Input id="locationEn" name="locationEn" defaultValue={therapist.locationEn ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="locationKo">Location (Korean)</Label>
              <Input id="locationKo" name="locationKo" defaultValue={therapist.locationKo ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="locationVi">Location (Vietnamese)</Label>
              <Input id="locationVi" name="locationVi" defaultValue={therapist.locationVi ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bioEn">Bio (English)</Label>
              <Textarea id="bioEn" name="bioEn" defaultValue={therapist.bioEn ?? ""} rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bioKo">Bio (Korean)</Label>
              <Textarea id="bioKo" name="bioKo" defaultValue={therapist.bioKo ?? ""} rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bioVi">Bio (Vietnamese)</Label>
              <Textarea id="bioVi" name="bioVi" defaultValue={therapist.bioVi ?? ""} rows={3} />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
