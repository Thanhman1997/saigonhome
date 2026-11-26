"use client"

import { useActionState } from "react"
import { updateServicesContent } from "@/app/actions/services-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const fields = [
  ["kicker", "Kicker"], ["title", "Title"], ["subtitle", "Description"],
] as const
const locales = [
  ["En", "English"], ["Ko", "한국어"], ["Vi", "Tiếng Việt"],
] as const

type ServicesContentFields = Record<"kickerEn" | "kickerKo" | "kickerVi" | "titleEn" | "titleKo" | "titleVi" | "subtitleEn" | "subtitleKo" | "subtitleVi", string>

export function ServicesContentForm({ content }: { content: ServicesContentFields }) {
  const [state, action, pending] = useActionState(updateServicesContent, { error: undefined })
  return <form action={action} className="flex flex-col gap-8">
    {fields.map(([key, label]) => <section key={key} className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{label}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {locales.map(([suffix, locale]) => { const name = `${key}${suffix}` as keyof ServicesContentFields; return <div key={name} className="flex flex-col gap-2"><Label htmlFor={name}>{locale}</Label><Input id={name} name={name} defaultValue={content[name] ?? ""} required /></div> })}
      </div>
    </section>)}
    {state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
    <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save Services content"}</Button>
  </form>
}
