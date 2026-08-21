"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { locales } from "@/lib/i18n/dictionary"
import { updateDefaultLocale } from "@/app/actions/languages"
import { cn } from "@/lib/utils"
import { useState } from "react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save default language"}
    </Button>
  )
}

export function LanguagesForm({ defaultLocale }: { defaultLocale: string }) {
  const [state, formAction] = useActionState(updateDefaultLocale, undefined)
  const [selected, setSelected] = useState(defaultLocale)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Default language</Label>
        <p className="text-xs text-muted-foreground">
          This is the language shown to first-time visitors before they choose one manually. Returning visitors keep
          their own saved preference.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {locales.map((item) => (
            <label
              key={item.code}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                selected === item.code
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="defaultLocale"
                value={item.code}
                checked={selected === item.code}
                onChange={() => setSelected(item.code)}
                className="size-4 accent-primary"
              />
              <span aria-hidden="true" className="text-2xl leading-none">
                {item.flag}
              </span>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div>
        <SubmitButton />
      </div>
    </form>
  )
}
