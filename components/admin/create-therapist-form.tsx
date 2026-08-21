"use client"

import { useActionState } from "react"
import { createTherapist } from "@/app/actions/therapists"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CreateTherapistForm() {
  const [state, action, pending] = useActionState(async (_prev: { error?: string } | undefined, formData: FormData) => {
    try {
      await createTherapist(formData)
      return { error: undefined }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Could not create therapist." }
    }
  }, undefined)

  return (
    <form action={action} className="flex items-end gap-2">
      <label className="flex flex-col gap-1 text-sm">
        <span>New therapist code</span>
        <Input name="code" placeholder="e.g. L-08" required />
      </label>
      <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add therapist"}</Button>
      {state?.error && <span className="text-sm text-destructive">{state.error}</span>}
    </form>
  )
}
