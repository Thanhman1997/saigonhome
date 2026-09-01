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
const valueImages = ["/images/spa-massage.png", "/images/spa-therapist.png", "/images/spa-oils.png", "/images/spa-couples.png"]

type About = Awaited<ReturnType<typeof getAboutContent>>
type LotusValue = Awaited<ReturnType<typeof getLotusValues>>[number]

export function AboutSection({ about, values }: { about: About; values: LotusValue[] }) {
  const { t, locale } = useLanguage()

  const title = about ? pickLocalized({ en: about.titleEn, ko: about.titleKo, vi: about.titleVi }, locale) : t.about.title
  const bodyKey = locale === "ko" ? "bodyKo" : locale === "vi" ? "bodyVi" : "bodyEn"
  const body = about && about[bodyKey].length > 0 ? about[bodyKey] : t.about.body

  return (
    <section id="about" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Image src="/images/lotus-philosophy-logo.png" alt="Lotus Wellness" width={720} height={420} className="mx-auto mb-3 h-auto w-48 object-contain sm:w-56 lg:w-64" loading="lazy" />
          <h2 className={`mt-0 text-balance font-extrabold leading-tight tracking-tight text-guiding-pink ${locale === "ko" ? "font-korean-serif text-4xl sm:text-5xl lg:text-6xl" : "font-serif text-4xl sm:text-5xl lg:text-6xl"}`}>{title}</h2>
          <div className="mt-8 flex flex-col gap-4 text-left">
            {body.map((paragraph, idx) => <p key={idx} className="text-pretty text-base leading-relaxed text-muted-foreground first:text-lg first:text-foreground">{paragraph}</p>)}
          </div>
        </div>
        <div className="mt-16 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-[1.45fr_.55fr]">
          <div className="relative min-h-80 overflow-hidden rounded-2xl sm:row-span-2 lg:min-h-[36rem]"><Image src="/images/spa-massage.png" alt="Therapist delivering a calming massage at home" fill loading="lazy" className="object-cover transition-transform duration-700 hover:scale-105" /></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {values.length > 0
            ? values.map((value) => {
                const Icon = ICON_MAP[value.icon] ?? Sparkles
                const text = pickLocalized({ en: value.textEn, ko: value.textKo, vi: value.textVi }, locale)
                return (
                  <article key={value.id} className="group flex min-h-44 items-center gap-4 rounded-2xl bg-accent/10 px-4 py-6 transition-all duration-500 hover:-translate-y-1 hover:bg-accent/15">
                    <div className="relative size-36 shrink-0 overflow-hidden rounded-full ring-2 ring-card"><Image src={valueImages[values.indexOf(value) % valueImages.length]} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-110" /></div>
                    <div className="flex min-w-0 items-center gap-2"><Icon className="size-5 shrink-0 text-accent" aria-hidden="true" /><h3 className="font-serif text-2xl font-semibold leading-tight text-accent">{text}</h3></div>
                  </article>
                )
              })
            : t.about.values.map((value, idx) => {
                const Icon = fallbackIcons[idx]
                return (
                  <article key={value} className="group flex min-h-44 items-center gap-4 rounded-2xl bg-accent/10 px-4 py-6 transition-all duration-500 hover:-translate-y-1 hover:bg-accent/15">
                    <div className="relative size-36 shrink-0 overflow-hidden rounded-full ring-2 ring-card"><Image src={valueImages[idx % valueImages.length]} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-110" /></div>
                    <div className="flex min-w-0 items-center gap-2"><Icon className="size-4 shrink-0 text-accent" aria-hidden="true" /><h3 className="font-serif text-xl leading-tight text-foreground">{value}</h3></div>
                  </article>
                )
              })}
          </div>
        </div>
      </div>
    </section>
  )
}
