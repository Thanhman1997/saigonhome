"use client"

import Image from "next/image"
import { Play, Sparkles } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-provider"

export function ExperienceVideo({ videoUrl }: { videoUrl?: string | null }) {
  const { t } = useLanguage()

  return (
    <section className="experience-video border-y border-border/70 bg-background py-24 lg:py-32" aria-labelledby="experience-video-title">
      <div className="mx-auto grid max-w-[100rem] gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20 lg:px-16">
        <div className="max-w-xl">
          <div className="mb-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-accent">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{t.experienceVideo.kicker}</span>
          </div>
          <h2 id="experience-video-title" className="text-balance font-sans text-[clamp(2.5rem,5vw,5.5rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-accent">
            {t.experienceVideo.title}
          </h2>
          <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
            {t.experienceVideo.description}
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px w-12 bg-border" aria-hidden="true" />
            <span>{t.experienceVideo.duration}</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[2rem] border border-border/80 bg-secondary p-2 shadow-[0_24px_70px_-38px_rgba(92,48,20,0.7)]">
          <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-secondary">
            <Image
              src="/images/service-deep-tissue.png"
              alt={t.experienceVideo.posterAlt}
              fill
              sizes="(min-width: 1024px) 60vw, 94vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
            <video className="absolute inset-0 h-full w-full object-cover" controls preload="metadata" poster="/images/service-deep-tissue.png" aria-label={t.experienceVideo.posterAlt}>
              {videoUrl && <source src={videoUrl} type={videoUrl.endsWith(".webm") ? "video/webm" : "video/mp4"} />}
            </video>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/10 to-transparent" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="grid h-20 w-20 place-items-center rounded-full border border-primary-foreground/70 bg-primary/90 text-primary-foreground shadow-xl transition duration-300 group-hover:scale-110" aria-hidden="true">
                <Play className="ml-1 h-7 w-7 fill-current" />
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex items-end justify-between text-primary-foreground">
              <span className="text-sm font-medium tracking-wide">{t.experienceVideo.watchLabel}</span>
              <span className="rounded-full border border-primary-foreground/50 px-3 py-1 text-xs">00:50</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
