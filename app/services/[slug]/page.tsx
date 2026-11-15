import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getServiceBySlug } from "@/lib/data"
import { formatVnd } from "@/lib/pricing"
import { ServiceBookingCta } from "@/components/sections/service-booking-cta"
import { BookingProvider } from "@/lib/booking-context"
import { BookingDialog } from "@/components/booking/booking-dialog"
import { getAvailableTherapists } from "@/lib/data"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lotus-wellness.vercel.app"

export const dynamic = "force-dynamic"
export const revalidate = 0


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const service = await getServiceBySlug(slug)
  if (!service) return { title: "Service not found | Lotus Wellness" }
  return {
    title: `${service.nameEn} in Ho Chi Minh City | Lotus Wellness`,
    description: `${service.descEn} Book a professional mobile massage in Ho Chi Minh City with Lotus Wellness.`,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: `${service.nameEn} | Lotus Wellness`, description: service.descEn, url: `${siteUrl}/services/${service.slug}`, type: "website" },
  }
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = await getServiceBySlug(slug)
  if (!service) notFound()
  const image = service.imageUrl || "/images/service-deep-tissue.png"
  const therapists = await getAvailableTherapists()

  return (
    <BookingProvider services={[service]} therapists={therapists}>
    <main className="bg-background">
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-16 lg:py-24">
        <div>
          <Link href="/services" className="text-sm font-semibold text-accent hover:underline">← All services</Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Mobile massage in Ho Chi Minh City</p>
          <h1 className="mt-4 max-w-3xl text-balance font-sans text-5xl font-semibold tracking-tight text-foreground md:text-7xl">{service.nameEn}</h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">{service.descEn} Enjoy thoughtful, private care delivered to your home, hotel, or preferred location in Ho Chi Minh City.</p>
          <ServiceBookingCta serviceId={service.id} durationMinutes={service.durations[0]?.minutes ?? null} />
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-border shadow-xl">
          <Image src={image} alt={service.nameEn} fill priority sizes="(min-width: 1024px) 45vw, 94vw" className="object-cover" />
        </div>
      </section>
      <section className="border-y border-border bg-muted px-5 py-16 lg:px-16">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
          <div><h2 className="text-3xl font-semibold">Choose your session</h2><p className="mt-3 leading-relaxed text-muted-foreground">Select the duration that fits your schedule. Every session is prepared with privacy, comfort, and professional care in mind.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">{service.durations.map((duration) => <div key={duration.id} className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{duration.minutes} minutes</p><p className="mt-2 text-xl font-semibold">{formatVnd(duration.priceVnd)}</p></div>)}</div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-5 py-16 text-center lg:py-24"><h2 className="text-3xl font-semibold">Professional care, wherever you are</h2><p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted-foreground">Lotus Wellness makes it simple to arrange a calm, professional massage experience at your location. Book online and our team will follow up by email.</p><ServiceBookingCta serviceId={service.id} durationMinutes={service.durations[0]?.minutes ?? null} /></section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Service", name: service.nameEn, description: service.descEn, provider: { "@type": "HealthAndBeautyBusiness", name: "Lotus Wellness", url: siteUrl }, areaServed: "Ho Chi Minh City", offers: service.durations.map((d) => ({ "@type": "Offer", price: d.priceVnd, priceCurrency: "VND", description: `${d.minutes} minute session` })) }) }} />
    </main>
    <BookingDialog />
    </BookingProvider>
  )
}
