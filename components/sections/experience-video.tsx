"use client"

import Image from "next/image"
import { Play, Sparkles } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-provider"

export function ExperienceVideo({ videoUrl }: { videoUrl?: string | null }) {
  const { t } = useLanguage()

  return (
    <section className="experience-video border-y border-border/70 bg-header-background py-24 lg:py-32" aria-labelledby="experience-video-title">
      <div className="mx-auto grid max-w-[100rem] gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20 lg:px-16">
        <div className="max-w-xl">
          <div className="mb-6 flex -translate-y-1 items-center gap-3 whitespace-nowrap section-heading text-accent" style={{ fontSize: "clamp(1.7rem, 3.2vw, 2.9rem)" }}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{t.experienceVideo.kicker}</span>
          </div>
          <h2 id="experience-video-title" className="text-balance text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
            {t.experienceVideo.title}
          </h2>
          <p className="mt-6 max-w-lg text-pretty font-sans text-base leading-relaxed text-muted-foreground">
            {t.experienceVideo.description}
          </p>
        </div>

        <div className="group relative w-full justify-self-end overflow-hidden lg:w-1/2 rounded-[1.5rem] border border-border/70 bg-secondary p-1.5 shadow-[0_24px_70px_-42px_rgba(92,48,20,0.65)]">
          <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-secondary">
            <Image
              src="/images/service-deep-tissue.png"
              alt={t.experienceVideo.posterAlt}
              fill
              sizes="(min-width: 1024px) 60vw, 94vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
            {videoUrl ? (
              <video className="absolute inset-0 h-full w-full object-cover" controls preload="metadata" poster="/images/service-deep-tissue.png" aria-label={t.experienceVideo.posterAlt}>
                <source src={videoUrl} type={videoUrl.endsWith(".webm") ? "video/webm" : "video/mp4"} />
              </video>
            ) : null}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/10 to-transparent" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="grid h-20 w-20 place-items-center rounded-full border border-primary-foreground/70 bg-primary/90 text-primary-foreground shadow-xl transition duration-300 group-hover:scale-110" aria-hidden="true">
                <Play className="ml-1 h-7 w-7 fill-current" />
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex items-end justify-between text-primary-foreground">
              <span className="text-sm font-medium tracking-wide">{t.experienceVideo.watchLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
