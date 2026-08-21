"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { createLotusValue, updateLotusValue } from "@/app/actions/lotus-values"
import { LOTUS_VALUE_ICONS } from "@/lib/lotus-values"

type ValueRow = {
  id: number
  textEn: string
  textKo: string
  textVi: string
  icon: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  )
}

export function LotusValueFormDialog({ value }: { value?: ValueRow }) {
  const [open, setOpen] = useState(false)
  const action = value ? updateLotusValue.bind(null, value.id) : createLotusValue
  const [state, formAction] = useActionState(action, undefined)
  const [icon, setIcon] = useState(value?.icon ?? "sparkles")

  useEffect(() => {
    if (state && !state.error) {
      setOpen(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {value ? (
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
            <Pencil className="size-4" />
            <span className="sr-only">Edit value</span>
          </Button>
        ) : (
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            New value
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{value ? "Edit guiding value" : "Add a guiding value"}</DialogTitle>
          <DialogDescription>Shown as the value cards in the About / Philosophy section.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="textEn">Value (English)</Label>
            <Input id="textEn" name="textEn" defaultValue={value?.textEn} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="textKo">Value (Korean)</Label>
            <Input id="textKo" name="textKo" defaultValue={value?.textKo} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="textVi">Value (Vietnamese)</Label>
            <Input id="textVi" name="textVi" defaultValue={value?.textVi} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="icon">Icon</Label>
            <Select name="icon" value={icon} onValueChange={setIcon}>
              <SelectTrigger id="icon" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOTUS_VALUE_ICONS.map((iconKey) => (
                  <SelectItem key={iconKey} value={iconKey}>
                    {iconKey}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <SubmitButton label={value ? "Save changes" : "Add value"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
