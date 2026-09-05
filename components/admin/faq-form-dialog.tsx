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
import { createFaq, updateFaq } from "@/app/actions/faq"

type FaqRow = {
  id: number
  questionEn: string
  questionKo: string
  questionVi: string
  answerEn: string
  answerKo: string
  answerVi: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  )
}

export function FaqFormDialog({ faq }: { faq?: FaqRow }) {
  const [open, setOpen] = useState(false)
  const action = faq ? updateFaq.bind(null, faq.id) : createFaq
  const [state, formAction] = useActionState(action, undefined)
  const [draftValues, setDraftValues] = useState<Record<string, string>>({})
  const autosaveStatus = useAdminAutosave("faq", String(faq?.id ?? "new"), draftValues)

  useEffect(() => {
    if (state && !state.error) {
      setOpen(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {faq ? (
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
            <Pencil className="size-4" />
            <span className="sr-only">Edit FAQ</span>
          </Button>
        ) : (
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            New FAQ
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{faq ? "Edit FAQ" : "Create a new FAQ"}</DialogTitle>
          <DialogDescription>Add a question and answer in all three languages.</DialogDescription>
        </DialogHeader>
        <form action={formAction} onChange={(event) => setDraftValues(Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="questionEn">Question (English)</Label>
              <Input id="questionEn" name="questionEn" defaultValue={faq?.questionEn} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="questionKo">Question (Korean)</Label>
              <Input id="questionKo" name="questionKo" defaultValue={faq?.questionKo} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="questionVi">Question (Vietnamese)</Label>
              <Input id="questionVi" name="questionVi" defaultValue={faq?.questionVi} required />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="answerEn">Answer (English)</Label>
              <Textarea id="answerEn" name="answerEn" defaultValue={faq?.answerEn} required rows={4} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="answerKo">Answer (Korean)</Label>
              <Textarea id="answerKo" name="answerKo" defaultValue={faq?.answerKo} required rows={4} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="answerVi">Answer (Vietnamese)</Label>
              <Textarea id="answerVi" name="answerVi" defaultValue={faq?.answerVi} required rows={4} />
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter><span className="text-sm text-muted-foreground" aria-live="polite">{autosaveStatus === "saving" ? "Saving..." : autosaveStatus === "saved" ? "Saved ✓" : autosaveStatus === "error" ? "Draft save failed" : ""}</span>
            <SubmitButton label={faq ? "Save changes" : "Create FAQ"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
