"use client"

import { useState } from "react"
import { Gem } from "lucide-react"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { formatVnd } from "@/lib/pricing"
import type { getMembershipPlans } from "@/lib/data"

type Plan = Awaited<ReturnType<typeof getMembershipPlans>>[number]

export function Membership({ plans }: { plans: Plan[] }) {
  const { t: dict, locale } = useLanguage()
  const t = dict.membership
  const [selected, setSelected] = useState(plans.at(-1)?.id)

  return <section id="membership" className="bg-background py-20 md:py-28"><div className="mx-auto max-w-6xl px-6"><div className="max-w-2xl"><p className="text-lg font-bold uppercase tracking-widest text-primary">{t.kicker}</p><h2 className="mt-3 text-balance font-serif text-3xl font-semibold leading-tight text-foreground md:text-4xl">{t.title}</h2><p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{t.subtitle}</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{plans.map((plan) => { const isSelected = selected === plan.id; const name = pickLocalized({ en: plan.nameEn, ko: plan.nameKo, vi: plan.nameVi }, locale); const description = pickLocalized({ en: plan.descriptionEn, ko: plan.descriptionKo, vi: plan.descriptionVi }, locale); return <button type="button" key={plan.id} onClick={() => setSelected(plan.id)} aria-pressed={isSelected} className={`flex min-h-80 flex-col justify-between rounded-3xl p-7 text-left transition-all ${isSelected ? "bg-lotus-pink text-lotus-pink-foreground shadow-lg ring-2 ring-lotus-pink ring-offset-4 ring-offset-background" : "bg-secondary/60 text-foreground hover:bg-secondary"}`}><div><Gem className={`size-6 ${isSelected ? "text-lotus-pink-foreground" : "text-primary"}`} aria-hidden="true" /><h3 className="mt-6 font-serif text-2xl">{name}</h3>{description && <p className={`mt-2 text-sm leading-relaxed ${isSelected ? "text-lotus-pink-foreground/85" : "text-muted-foreground"}`}>{description}</p>}<p className="mt-4 text-3xl font-semibold">{formatVnd(plan.priceVnd)}</p><p className={`mt-4 text-sm uppercase tracking-wide ${isSelected ? "text-lotus-pink-foreground/75" : "text-muted-foreground"}`}>{t.bonus}</p><p className="mt-1 text-lg font-medium">+{formatVnd(plan.bonusVnd)}</p>{plan.benefits.length > 0 && <ul className={`mt-4 flex flex-col gap-1 text-sm ${isSelected ? "text-lotus-pink-foreground/90" : "text-muted-foreground"}`}>{plan.benefits.map((b, idx) => <li key={idx}>• {b}</li>)}</ul>}</div><span className={`mt-8 inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium ${isSelected ? "bg-background text-foreground" : "bg-background/70"}`}>{t.choose}</span></button> })}</div></div></section>
}
