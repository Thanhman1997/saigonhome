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
          <h2 className={`mt-0 text-balance font-extrabold leading-tight tracking-tight text-guiding-pink ${locale === "ko" ? "font-korean-sans tracking-[-0.02em]" : "font-sans tracking-[-0.02em]"}`} style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>{title}</h2>
          <div className="mt-8 flex flex-col gap-4 text-left">
            {body.map((paragraph, idx) => <p key={idx} className="text-pretty text-base leading-relaxed text-muted-foreground first:text-lg first:text-foreground">{paragraph}</p>)}
          </div>
        </div>
        <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="relative min-h-80 overflow-hidden rounded-2xl lg:min-h-[22rem]"><Image src="/images/spa-massage.png" alt="Therapist delivering a calming massage at home" fill loading="lazy" className="object-cover transition-transform duration-700 hover:scale-105" /></div>
          <div className="grid gap-3">
            {values.length > 0 ? values.map((value, index) => {
              const Icon = ICON_MAP[value.icon] ?? Sparkles
              const text = pickLocalized({ en: value.textEn, ko: value.textKo, vi: value.textVi }, locale)
              return <article key={value.id} className="group flex min-h-28 w-full items-center gap-3 rounded-2xl bg-accent/10 px-3 py-3 transition-all duration-500 hover:-translate-y-1 hover:bg-accent/15"><div className="relative size-24 shrink-0 overflow-hidden rounded-full ring-2 ring-card"><Image src={valueImages[index % valueImages.length]} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-110" /></div><div className="flex min-w-0 items-center gap-2"><Icon className="size-5 shrink-0 text-accent" aria-hidden="true" /><h3 className="whitespace-nowrap font-serif text-3xl font-semibold leading-tight text-accent">{text}</h3></div></article>
            }) : t.about.values.map((value, index) => {
              const Icon = fallbackIcons[index]
              return <article key={value} className="group flex min-h-28 w-full items-center gap-3 rounded-2xl bg-accent/10 px-3 py-3 transition-all duration-500 hover:-translate-y-1 hover:bg-accent/15"><div className="relative size-24 shrink-0 overflow-hidden rounded-full ring-2 ring-card"><Image src={valueImages[index % valueImages.length]} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-110" /></div><div className="flex min-w-0 items-center gap-2"><Icon className="size-4 shrink-0 text-accent" aria-hidden="true" /><h3 className="whitespace-nowrap font-serif text-3xl font-semibold leading-tight text-accent">{value}</h3></div></article>
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
