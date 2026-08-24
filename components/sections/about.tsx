"use client"

import { Flower2, HeartHandshake, Home, Leaf, ShieldCheck, Sparkles } from "lucide-react"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import type { getAboutContent, getLotusValues } from "@/lib/data"

type About = Awaited<ReturnType<typeof getAboutContent>>
type LotusValue = Awaited<ReturnType<typeof getLotusValues>>[number]
const icons = [HeartHandshake, Home, Leaf, ShieldCheck]

export function AboutSection({ about, values }: { about: About; values: LotusValue[] }) {
  const { t, locale } = useLanguage()
  const title = about ? pickLocalized({ en: about.titleEn, ko: about.titleKo, vi: about.titleVi }, locale) : t.about.title
  const bodyKey = locale === "ko" ? "bodyKo" : locale === "vi" ? "bodyVi" : "bodyEn"
  const body = about && about[bodyKey].length ? about[bodyKey] : t.about.body
  const fallbackValues = t.about.values

  return (
    <section id="about" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative min-h-[440px] overflow-hidden rounded-xl border border-border bg-secondary/60">
            <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(45deg,transparent_48%,var(--border)_49%,var(--border)_51%,transparent_52%)] [background-size:42px_42px]" />
            <div className="relative flex min-h-[440px] flex-col items-center justify-center p-8 text-center"><Flower2 className="size-16 text-accent" /><p className="mt-5 font-serif text-3xl">Private wellness setting</p><p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Editorial image placeholder</p></div>
          </div>
          <div>
            <p className="section-kicker">Lotus Wellness</p>
            <h2 className="section-title">{title}</h2>
            <div className="mt-6 flex flex-col gap-4">{body.slice(0, 3).map((paragraph, index) => <p key={index} className="text-pretty text-base leading-relaxed text-muted-foreground">{paragraph}</p>)}</div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {(values.length ? values.slice(0, 4).map((value) => pickLocalized({ en: value.textEn, ko: value.textKo, vi: value.textVi }, locale)) : fallbackValues.slice(0, 4)).map((value, index) => { const Icon = icons[index] ?? Sparkles; return <div key={value} className="flex items-center gap-3 border-t border-border pt-4"><Icon className="size-5 shrink-0 text-accent" /><span className="text-sm font-medium">{value}</span></div> })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
