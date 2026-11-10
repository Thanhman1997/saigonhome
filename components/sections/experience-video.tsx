"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Play, Sparkles } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-provider"

const MIN_RATIO = 0.4
const MAX_RATIO = 3

function clampRatio(ratio: number) {
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio))
}

export function ExperienceVideo({ video }: { video?: { videoUrl: string; thumbnailUrl: string | null; aspectRatio: number } | null }) {
  const { t } = useLanguage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ratio, setRatio] = useState(clampRatio(video?.aspectRatio ?? 16 / 9))
  const [started, setStarted] = useState(false)

  const poster = video?.thumbnailUrl ?? "/images/service-deep-tissue.png"

  function handleMetadata(element: HTMLVideoElement) {
    if (element.videoWidth > 0 && element.videoHeight > 0) {
      setRatio(clampRatio(element.videoWidth / element.videoHeight))
    }
  }

  function handlePlay() {
    void videoRef.current?.play()
  }

  return (
    <section className="experience-video border-y border-border/70 bg-header-background py-24 lg:py-32" aria-labelledby="experience-video-title">
      <div className="mx-auto grid max-w-[92rem] gap-10 px-6 lg:grid-cols-[0.55fr_1.45fr] lg:items-center lg:gap-14 lg:px-16">
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

        <div
          className="group relative mx-auto w-full overflow-hidden rounded-[1.5rem] border border-border/70 bg-secondary p-1.5 shadow-[0_24px_70px_-42px_rgba(92,48,20,0.65)] lg:justify-self-center"
          style={{ maxWidth: `calc(80vh * ${ratio} + 0.75rem)` }}
        >
          <div className="relative overflow-hidden rounded-[1.1rem] bg-foreground" style={{ aspectRatio: ratio }}>
            {!started ? (
              <Image
                src={poster}
                alt={t.experienceVideo.posterAlt}
                fill
                sizes="(min-width: 1024px) 70vw, 94vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
            ) : null}
            {video?.videoUrl ? (
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full bg-foreground object-contain"
                controls
                playsInline
                preload="metadata"
                poster={poster}
                aria-label={t.experienceVideo.posterAlt}
                onLoadedMetadata={(event) => handleMetadata(event.currentTarget)}
                onPlay={() => setStarted(true)}
                onEnded={() => setStarted(false)}
              >
                <source src={video.videoUrl} type={video.videoUrl.endsWith(".webm") ? "video/webm" : "video/mp4"} />
              </video>
            ) : null}
            {!started ? (
              <>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/10 to-transparent" aria-hidden="true" />
                <button
                  type="button"
                  onClick={handlePlay}
                  disabled={!video?.videoUrl}
                  aria-label={t.experienceVideo.watchLabel}
                  className="absolute inset-0 grid place-items-center focus-visible:outline-none"
                >
                  <span className="grid h-20 w-20 place-items-center rounded-full border border-primary-foreground/70 bg-primary/90 text-primary-foreground shadow-xl transition duration-300 group-hover:scale-110 group-focus-within:ring-2 group-focus-within:ring-ring">
                    <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />
                  </span>
                </button>
                <span className="pointer-events-none absolute bottom-5 left-5 right-5 text-sm font-medium tracking-wide text-primary-foreground">{t.experienceVideo.watchLabel}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
