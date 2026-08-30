"use client"

import Image from "next/image"
import { Sparkles, Home, Wallet, Lock, Flower2, Scale, Moon, Heart, Leaf } from "lucide-react"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import type { getAboutContent, getLotusValues } from "@/lib/data"

const ICON_MAP: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  home: Home,
  wallet: Wallet,
  lock: Lock,
  flower: Flower2,
  scale: Scale,
  moon: Moon,
  heart: Heart,
  leaf: Leaf,
}
const fallbackIcons = [Sparkles, Home, Wallet, Lock]

type About = Awaited<ReturnType<typeof getAboutContent>>
type LotusValue = Awaited<ReturnType<typeof getLotusValues>>[number]

export function AboutSection({ about, values }: { about: About; values: LotusValue[] }) {
  const { t, locale } = useLanguage()

  const title = about ? pickLocalized({ en: about.titleEn, ko: about.titleKo, vi: about.titleVi }, locale) : t.about.title
  const bodyKey = locale === "ko" ? "bodyKo" : locale === "vi" ? "bodyVi" : "bodyEn"
  const body = about && about[bodyKey].length > 0 ? about[bodyKey] : t.about.body

  return (
    <section id="about" className="bg-muted py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Image src="/images/lotus-philosophy-logo.png" alt="Lotus Wellness" width={720} height={420} className="mx-auto mb-3 h-auto w-48 object-contain sm:w-56 lg:w-64" loading="lazy" />
          <h2 className={`mt-0 text-balance font-extrabold leading-tight tracking-tight text-guiding-pink ${locale === "ko" ? "font-korean-serif text-4xl sm:text-5xl lg:text-6xl" : "font-serif text-4xl sm:text-5xl lg:text-6xl"}`}>{title}</h2>
          <div className="mt-8 flex flex-col gap-4 text-left">
            {body.map((paragraph, idx) => <p key={idx} className="text-pretty text-base leading-relaxed text-muted-foreground first:text-lg first:text-foreground">{paragraph}</p>)}
          </div>
        </div>
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.length > 0
            ? values.map((value) => {
                const Icon = ICON_MAP[value.icon] ?? Sparkles
                const text = pickLocalized({ en: value.textEn, ko: value.textKo, vi: value.textVi }, locale)
                return (
                  <article key={value.id} className="rounded-2xl bg-muted p-6">
                    <Icon className="size-7 text-accent" />
                    <h3 className="mt-5 font-serif text-2xl">{text}</h3>
                  </article>
                )
              })
            : t.about.values.map((value, idx) => {
                const Icon = fallbackIcons[idx]
                return (
                  <article key={value} className="rounded-2xl bg-muted p-6">
                    <Icon className="size-7 text-accent" />
                    <h3 className="mt-5 font-serif text-2xl">{value}</h3>
                  </article>
                )
              })}
        </div>
      </div>
    </section>
  )
}
