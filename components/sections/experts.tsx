"use client"

import { useState } from "react"
import { ArrowRight, Languages, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBooking, type TherapistRow } from "@/lib/booking-context"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"

const PAGE_SIZE = 4

export function ExpertsSection({ therapists }: { therapists: TherapistRow[] }) {
  const { t, locale } = useLanguage()
  const { openBooking } = useBooking()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  return (
    <section id="experts" className="border-y border-border bg-muted py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl"><p className="section-kicker">{t.experts.kicker}</p><h2 className="section-title">{t.experts.title}</h2><p className="section-copy">{t.experts.subtitle}</p></div>
          <p className="max-w-sm rounded-lg border border-border bg-background p-4 text-xs leading-relaxed text-muted-foreground">{locale === "vi" ? "Hình ảnh đang là placeholder. Hồ sơ, lịch trống và lựa chọn chuyên viên được lấy trực tiếp từ hệ thống đặt lịch." : locale === "ko" ? "현재 이미지는 플레이스홀더입니다. 프로필과 예약 가능 여부는 예약 시스템에서 불러옵니다." : "Portraits are placeholders. Profiles and availability are loaded from the live booking system."}</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {therapists.slice(0, visibleCount).map((therapist) => {
            const bio = pickLocalized({ en: therapist.bioEn ?? "", ko: therapist.bioKo ?? "", vi: therapist.bioVi ?? "" }, locale)
            return (
              <article key={therapist.id} className="overflow-hidden rounded-xl border border-border bg-background">
                <div className="relative grid aspect-[4/3] place-items-center bg-secondary/55">
                  <div className="grid size-20 place-items-center rounded-full border border-accent/25 bg-background text-accent"><UserRound className="size-9" /></div>
                  <span className="absolute bottom-3 left-3 rounded-full bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Portrait placeholder</span>
                </div>
                <div className="flex min-h-64 flex-col p-5">
                  <div className="flex items-start justify-between gap-3"><h3 className="font-serif text-2xl font-semibold">{therapist.code}</h3><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">{therapist.available ? t.experts.available : t.experts.unavailable}</span></div>
                  {therapist.languages && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Languages className="size-4" />{therapist.languages}</p>}
                  {bio && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{bio}</p>}
                  <Button disabled={!therapist.available} variant="outline" className="mt-auto w-full" onClick={() => openBooking({ therapistId: therapist.id })}>{t.experts.book}<ArrowRight data-icon="inline-end" /></Button>
                </div>
              </article>
            )
          })}
        </div>
        {visibleCount < therapists.length && <div className="mt-9 flex justify-center"><Button variant="outline" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>{locale === "vi" ? "Xem thêm chuyên viên" : locale === "ko" ? "더 보기" : "View more therapists"}</Button></div>}
      </div>
    </section>
  )
}
