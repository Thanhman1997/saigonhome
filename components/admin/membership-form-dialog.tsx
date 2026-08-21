"use client"

import { useActionState, useEffect, useState } from "react"
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
import { createMembershipPlan, updateMembershipPlan } from "@/app/actions/membership"

type MembershipRow = {
  id: number
  nameEn: string
  nameKo: string
  nameVi: string
  descriptionEn: string
  descriptionKo: string
  descriptionVi: string
  benefits: string[]
  validityDays: number | null
  priceVnd: number
  bonusVnd: number
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  )
}

export function MembershipFormDialog({ plan }: { plan?: MembershipRow }) {
  const [open, setOpen] = useState(false)
  const action = plan ? updateMembershipPlan.bind(null, plan.id) : createMembershipPlan
  const [state, formAction] = useActionState(action, undefined)

  useEffect(() => {
    if (state && !state.error) {
      setOpen(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {plan ? (
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
            <Pencil className="size-4" />
            <span className="sr-only">Edit plan</span>
          </Button>
        ) : (
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            New plan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit membership plan" : "Create a membership plan"}</DialogTitle>
          <DialogDescription>Prepaid balance plans shown on the public membership section.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameEn">Name (English)</Label>
              <Input id="nameEn" name="nameEn" defaultValue={plan?.nameEn} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameKo">Name (Korean)</Label>
              <Input id="nameKo" name="nameKo" defaultValue={plan?.nameKo} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameVi">Name (Vietnamese)</Label>
              <Input id="nameVi" name="nameVi" defaultValue={plan?.nameVi} required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descriptionEn">Description (English)</Label>
              <Textarea id="descriptionEn" name="descriptionEn" defaultValue={plan?.descriptionEn} rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descriptionKo">Description (Korean)</Label>
              <Textarea id="descriptionKo" name="descriptionKo" defaultValue={plan?.descriptionKo} rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descriptionVi">Description (Vietnamese)</Label>
              <Textarea id="descriptionVi" name="descriptionVi" defaultValue={plan?.descriptionVi} rows={3} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="benefits">Benefits (one per line)</Label>
            <Textarea
              id="benefits"
              name="benefits"
              defaultValue={plan?.benefits.join("\n")}
              rows={4}
              placeholder={"Free towel service\nPriority booking"}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="priceVnd">Price (VND)</Label>
              <Input id="priceVnd" name="priceVnd" type="number" min="0" step="1000" defaultValue={plan?.priceVnd} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bonusVnd">Bonus (VND)</Label>
              <Input id="bonusVnd" name="bonusVnd" type="number" min="0" step="1000" defaultValue={plan?.bonusVnd} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="validityDays">Validity (days, optional)</Label>
              <Input id="validityDays" name="validityDays" type="number" min="1" defaultValue={plan?.validityDays ?? ""} />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <SubmitButton label={plan ? "Save changes" : "Create plan"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
