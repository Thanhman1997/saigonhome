import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getAvailableTherapists, getBookingSettings, getServiceBySlug } from "@/lib/data"
import { formatVnd } from "@/lib/pricing"
import { ServiceBookingCta } from "@/components/sections/service-booking-cta"
import { LocalizedText } from "@/components/localized-text"
import { BookingProvider } from "@/lib/booking-context"
import { BookingDialog } from "@/components/booking/booking-dialog"
import { getSiteUrl } from "@/lib/site-url"
import { SITE_NAME, buildPageMetadata, clipText, getSeoContext, localizedUrl, pickByLocale } from "@/lib/seo"
import { serviceCopy } from "@/lib/seo-copy"

const siteUrl = getSiteUrl()

export const dynamic = "force-dynamic"
export const revalidate = 0

const copy = {
  back: { en: "← All services", vi: "← Tất cả dịch vụ", ko: "← 전체 서비스" },
  kicker: { en: "Mobile massage in Ho Chi Minh City", vi: "Massage tại nhà ở TP. Hồ Chí Minh", ko: "호치민 출장 마사지" },
  intro: {
    en: "Enjoy thoughtful, private care delivered to your home, hotel, or preferred location in Ho Chi Minh City.",
    vi: "Trải nghiệm dịch vụ chăm sóc riêng tư, chu đáo ngay tại nhà, khách sạn hoặc địa điểm bạn chọn ở TP. Hồ Chí Minh.",
    ko: "호치민의 자택, 호텔 또는 원하시는 장소에서 프라이빗하고 세심한 케어를 받아보세요.",
  },
  chooseTitle: { en: "Choose your session", vi: "Chọn thời lượng buổi massage", ko: "세션 선택" },
  chooseBody: {
    en: "Select the duration that fits your schedule. Every session is prepared with privacy, comfort, and professional care in mind.",
    vi: "Chọn thời lượng phù hợp với lịch trình của bạn. Mỗi buổi đều được chuẩn bị với sự riêng tư, thoải mái và chăm sóc chuyên nghiệp.",
    ko: "일정에 맞는 시간을 선택하세요. 모든 세션은 프라이버시와 편안함, 전문적인 케어를 우선으로 준비됩니다.",
  },
  headingLead: { en: "Professional care, ", vi: "Chăm sóc chuyên nghiệp, ", ko: "전문적인 케어를, " },
  headingEm: { en: "wherever you are", vi: "ở bất cứ đâu bạn cần", ko: "어디에서든" },
  closing: {
    en: "Lotus Wellness makes it simple to arrange a calm, professional massage experience at your location. Book online and our team will follow up by email.",
    vi: "Lotus Wellness giúp bạn dễ dàng đặt một buổi massage thư giãn, chuyên nghiệp tại địa điểm của bạn. Đặt lịch trực tuyến và đội ngũ của chúng tôi sẽ phản hồi qua email.",
    ko: "Lotus Wellness는 원하시는 장소에서 편안하고 전문적인 마사지를 간편하게 예약하실 수 있도록 도와드립니다. 온라인으로 예약하시면 이메일로 안내해 드립니다.",
  },
}

function minutesLabel(minutes: number) {
  return { en: `${minutes} minutes`, vi: `${minutes} phút`, ko: `${minutes}분` }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [service, ctx] = await Promise.all([getServiceBySlug(slug), getSeoContext()])
  if (!service) return { title: "Service not found", robots: { index: false, follow: false } }
  const name = pickByLocale({ en: service.nameEn, vi: service.nameVi, ko: service.nameKo }, ctx.locale)
  const summary = pickByLocale({ en: service.descEn, vi: service.descVi, ko: service.descKo }, ctx.locale)
  const suffix = serviceCopy.descriptionSuffix[ctx.locale]
  return buildPageMetadata({
    path: `/services/${service.slug}`,
    ctx,
    title: { absolute: `${serviceCopy.title(name)[ctx.locale]} | ${SITE_NAME}` },
    description: `${clipText(summary, 150 - suffix.length)} ${suffix}`.trim(),
    image: service.imageUrl ? { url: service.imageUrl, alt: name } : undefined,
  })
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [service, ctx] = await Promise.all([getServiceBySlug(slug), getSeoContext()])
  if (!service) notFound()
  const image = service.imageUrl || "/images/service-deep-tissue.png"
  const [therapists, bookingSettings] = await Promise.all([getAvailableTherapists(), getBookingSettings()])
  const name = pickByLocale({ en: service.nameEn, vi: service.nameVi, ko: service.nameKo }, ctx.locale)
  const description = pickByLocale({ en: service.descEn, vi: service.descVi, ko: service.descKo }, ctx.locale)
  const pageUrl = localizedUrl(`/services/${service.slug}`, ctx.prefix ?? ctx.defaultLocale, ctx.defaultLocale)
  const absoluteImage = image.startsWith("http") ? image : `${siteUrl}${image}`

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name,
      description,
      url: pageUrl,
      image: absoluteImage,
      inLanguage: ctx.locale,
      serviceType: "Mobile massage",
      provider: { "@id": `${siteUrl}/#business` },
      areaServed: { "@type": "City", name: "Ho Chi Minh City" },
      offers: service.durations.map((d) => ({
        "@type": "Offer",
        price: d.priceVnd,
        priceCurrency: "VND",
        url: pageUrl,
        availability: "https://schema.org/InStock",
        description: minutesLabel(d.minutes)[ctx.locale],
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: localizedUrl("/", ctx.prefix ?? ctx.defaultLocale, ctx.defaultLocale) },
        { "@type": "ListItem", position: 2, name: pickByLocale({ en: "Services", vi: "Dịch vụ", ko: "서비스" }, ctx.locale), item: localizedUrl("/services", ctx.prefix ?? ctx.defaultLocale, ctx.defaultLocale) },
        { "@type": "ListItem", position: 3, name, item: pageUrl },
      ],
    },
  ]

  return (
    <BookingProvider services={[service]} therapists={therapists} maxGuests={bookingSettings?.maxGuests}>
    <main className="bg-background">
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-16 lg:py-24">
        <div>
          <Link href="/services" className="text-lg font-semibold text-foreground hover:underline"><LocalizedText text={copy.back} /></Link>
          <p className="mt-10 text-base font-semibold uppercase tracking-widest text-foreground md:text-lg"><LocalizedText text={copy.kicker} /></p>
          <h1 className="mt-4 max-w-3xl text-balance font-sans text-4xl! font-semibold leading-tight tracking-tight text-foreground sm:text-5xl! lg:text-6xl!">
            <LocalizedText text={{ en: service.nameEn, vi: service.nameVi || service.nameEn, ko: service.nameKo || service.nameEn }} />
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-xl leading-relaxed text-muted-foreground md:text-2xl">
            <LocalizedText text={{ en: service.descEn, vi: service.descVi || service.descEn, ko: service.descKo || service.descEn }} />{" "}
            <LocalizedText text={copy.intro} />
          </p>
          <ServiceBookingCta serviceId={service.id} durationMinutes={service.durations[0]?.minutes ?? null} />
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-border shadow-xl">
          <Image src={image} alt={name} fill priority sizes="(min-width: 1024px) 45vw, 94vw" className="object-cover" />
        </div>
      </section>
      <section className="border-y border-border bg-muted px-5 py-16 lg:px-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl! font-semibold leading-tight md:text-4xl!"><LocalizedText text={copy.chooseTitle} /></h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground md:text-xl"><LocalizedText text={copy.chooseBody} /></p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {service.durations.map((duration) => (
              <div key={duration.id} className="rounded-2xl border border-border bg-card px-4 py-5">
                <p className="text-lg text-muted-foreground"><LocalizedText text={minutesLabel(duration.minutes)} /></p>
                <p className="mt-2 text-2xl font-semibold tracking-tight xl:text-3xl">{formatVnd(duration.priceVnd)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section aria-labelledby="service-care-heading" className="mx-auto max-w-4xl px-5 py-16 text-center lg:py-20">
        <h2 id="service-care-heading" className="text-balance font-[Georgia,serif] text-4xl! font-medium leading-tight tracking-tight text-foreground sm:text-5xl!">
          <LocalizedText text={copy.headingLead} /><em className="inline-block"><LocalizedText text={copy.headingEm} /></em>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-pretty font-sans text-lg leading-relaxed text-foreground md:text-xl"><LocalizedText text={copy.closing} /></p>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </main>
    <BookingDialog />
    </BookingProvider>
  )
}
