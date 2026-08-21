"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateContactInfo } from "@/app/actions/contact"

type ContactInfoRow = {
  id: number
  phone: string
  email: string
  whatsappUrl: string | null
  lineUrl: string | null
  kakaoUrl: string | null
  messengerUrl: string | null
  instagramUrl: string | null
  addressEn: string | null
  addressKo: string | null
  addressVi: string | null
  hoursEn: string | null
  hoursKo: string | null
  hoursVi: string | null
} | null

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save contact info"}
    </Button>
  )
}

export function ContactForm({ contact }: { contact: ContactInfoRow }) {
  const [state, formAction] = useActionState(updateContactInfo, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {contact?.id && <input type="hidden" name="id" value={contact.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} required />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-foreground">Chat links</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="whatsappUrl">WhatsApp URL</Label>
            <Input id="whatsappUrl" name="whatsappUrl" defaultValue={contact?.whatsappUrl ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lineUrl">LINE URL</Label>
            <Input id="lineUrl" name="lineUrl" defaultValue={contact?.lineUrl ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kakaoUrl">KakaoTalk URL</Label>
            <Input id="kakaoUrl" name="kakaoUrl" defaultValue={contact?.kakaoUrl ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="messengerUrl">Messenger URL</Label>
            <Input id="messengerUrl" name="messengerUrl" defaultValue={contact?.messengerUrl ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input id="instagramUrl" name="instagramUrl" defaultValue={contact?.instagramUrl ?? ""} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-foreground">Service area (optional)</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addressEn">Area (English)</Label>
            <Input id="addressEn" name="addressEn" defaultValue={contact?.addressEn ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addressKo">Area (Korean)</Label>
            <Input id="addressKo" name="addressKo" defaultValue={contact?.addressKo ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addressVi">Area (Vietnamese)</Label>
            <Input id="addressVi" name="addressVi" defaultValue={contact?.addressVi ?? ""} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-foreground">Hours (optional)</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hoursEn">Hours (English)</Label>
            <Input id="hoursEn" name="hoursEn" defaultValue={contact?.hoursEn ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hoursKo">Hours (Korean)</Label>
            <Input id="hoursKo" name="hoursKo" defaultValue={contact?.hoursKo ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hoursVi">Hours (Vietnamese)</Label>
            <Input id="hoursVi" name="hoursVi" defaultValue={contact?.hoursVi ?? ""} />
          </div>
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div>
        <SubmitButton />
      </div>
    </form>
  )
}
