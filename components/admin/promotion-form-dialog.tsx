"use client"

import { useActionState, useEffect, useState } from "react"
import { useAdminAutosave } from "@/hooks/use-admin-autosave"
import { useFormStatus } from "react-dom"
import { Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { createPromotion, updatePromotion } from "@/app/actions/promotions"

type PromotionRow = {
  id: number
  nameEn: string
  nameKo: string
  nameVi: string
  descEn: string
  descKo: string
  descVi: string
  type: string
  discountLabel: string | null
  discountType: string
  discountValue: string
  startDate: string | null
  endDate: string | null
  imageUrl: string | null
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  )
}

export function PromotionFormDialog({ promotion }: { promotion?: PromotionRow }) {
  const [open, setOpen] = useState(false)
  const action = promotion ? updatePromotion.bind(null, promotion.id) : createPromotion
  const [state, formAction] = useActionState(action, undefined)
  const [type, setType] = useState(promotion?.type ?? "seasonal")
  const [imageUrl, setImageUrl] = useState<string | null>(promotion?.imageUrl ?? null)

  useEffect(() => {
    if (state && !state.error) {
      setOpen(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {promotion ? (
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
            <Pencil className="size-4" />
            <span className="sr-only">Edit promotion</span>
          </Button>
        ) : (
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            New promotion
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{promotion ? "Edit promotion" : "Create a new promotion"}</DialogTitle>
          <DialogDescription>First-time and combo offers are always shown; seasonal offers run between dates.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Promotion type</Label>
            <Select name="type" value={type} onValueChange={setType}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_time">First-time customer</SelectItem>
                <SelectItem value="combo">Combo / group discount</SelectItem>
                <SelectItem value="seasonal">Seasonal event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameEn">Name (English)</Label>
              <Input id="nameEn" name="nameEn" defaultValue={promotion?.nameEn} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameKo">Name (Korean)</Label>
              <Input id="nameKo" name="nameKo" defaultValue={promotion?.nameKo} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameVi">Name (Vietnamese)</Label>
              <Input id="nameVi" name="nameVi" defaultValue={promotion?.nameVi} required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descEn">Description (English)</Label>
              <Textarea id="descEn" name="descEn" defaultValue={promotion?.descEn} required rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descKo">Description (Korean)</Label>
              <Textarea id="descKo" name="descKo" defaultValue={promotion?.descKo} required rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descVi">Description (Vietnamese)</Label>
              <Textarea id="descVi" name="descVi" defaultValue={promotion?.descVi} required rows={3} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discountLabel">{'Badge label (e.g. "5% OFF")'}</Label>
              <Input id="discountLabel" name="discountLabel" defaultValue={promotion?.discountLabel ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discountValue">Discount value</Label>
              <Input
                id="discountValue"
                name="discountValue"
                type="number"
                step="0.01"
                min="0"
                defaultValue={promotion?.discountValue}
                required
              />
            </div>
          </div>

          <input type="hidden" name="discountType" value="percent" />

          {type === "seasonal" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="startDate">Start date</Label>
                <Input id="startDate" name="startDate" type="date" defaultValue={promotion?.startDate ?? ""} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="endDate">End date</Label>
                <Input id="endDate" name="endDate" type="date" defaultValue={promotion?.endDate ?? ""} required />
              </div>
            </div>
          )}

          <ImageUpload label="Promotion image" name="imageUrl" value={imageUrl} onChange={setImageUrl} aspect="aspect-video" />

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <SubmitButton label={promotion ? "Save changes" : "Create promotion"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
