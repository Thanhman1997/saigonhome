"use client"

import Image from "next/image"
import { ArrowRight, Check, Clock3, Facebook, HeartHandshake, House, Instagram, Leaf, Menu, MessageCircle, Phone, Send, ShieldCheck, Sparkles, Star, Users, X, Youtube } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/lib/booking-context"
import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import type { Locale } from "@/lib/i18n/dictionary"
import type { ServiceWithDurations, TherapistRow } from "@/lib/booking-context"

type Review = Record<string, unknown>

type Props = {
  services: ServiceWithDurations[]
  therapists: TherapistRow[]
  reviews: Review[]
}

const benefits = [
  { icon: Leaf, title: "Natural Ingredients", text: "Thoughtful oils and products chosen for calm, healthy skin." },
  { icon: HeartHandshake, title: "Expert Therapists", text: "Skilled professionals who listen to what your body needs." },
  { icon: ShieldCheck, title: "Safe, Clean Care", text: "A trusted, private experience from arrival to goodbye." },
  { icon: Clock3, title: "Flexible Scheduling", text: "Book a time that fits your day, wherever you are." },
]

const whyLotus = [
  { icon: Users, title: "Professional Therapists", text: "Highly trained and experienced experts." },
  { icon: House, title: "In-Home Comfort", text: "Enjoy your massage in the privacy of your home." },
  { icon: Sparkles, title: "Premium Products", text: "High-quality oils and premium products." },
  { icon: ShieldCheck, title: "Safe & Trusted", text: "Your safety, comfort, and satisfaction come first." },
]

function localizedService(service: ServiceWithDurations, locale: Locale) {
  return {
    name: pickLocalized({ en: service.nameEn, ko: service.nameKo, vi: service.nameVi }, locale),
    description: pickLocalized({ en: service.descEn, ko: service.descKo, vi: service.descVi }, locale),
  }
}

function BookingButton({ children, className }: { children: ReactNode; className?: string }) {
  const { openBooking } = useBooking()
  return <Button onClick={() => openBooking()} className={className}>{children}<ArrowRight data-icon="inline-end" /></Button>
}

export function HomepageRedesign({ services, therapists, reviews }: Props) {
  const { locale } = useLanguage()
  const { openBooking } = useBooking()
  const [menuOpen, setMenuOpen] = useState(false)
  const featuredServices = services.slice(0, 5)
  const featuredTherapists = therapists.slice(0, 4)

  return (
    <div className="bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#top" aria-label="Lotus Wellness home"><Image src="/images/lotus-logo.png" alt="Lotus Wellness Massage" width={150} height={70} className="h-14 w-auto object-contain" /></a>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
            {[{ label: "Home", href: "#top" }, { label: "Services", href: "#services" }, { label: "Therapists", href: "#therapists" }, { label: "About", href: "#about" }, { label: "Contact", href: "#contact" }].map((link) => <a key={link.href} href={link.href} className="text-sm font-medium transition-colors hover:text-accent">{link.label}</a>)}
          </nav>
          <div className="hidden lg:block"><BookingButton className="bg-accent text-accent-foreground hover:bg-accent/90">Book an Appointment</BookingButton></div>
          <button className="flex size-11 items-center justify-center lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <nav className="flex flex-col gap-5 border-t border-border bg-background px-5 py-6 lg:hidden" aria-label="Mobile navigation">{[{ label: "Home", href: "#top" }, { label: "Services", href: "#services" }, { label: "Therapists", href: "#therapists" }, { label: "About", href: "#about" }, { label: "Contact", href: "#contact" }].map((link) => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="font-serif text-2xl">{link.label}</a>)}<BookingButton className="w-full bg-accent text-accent-foreground">Book an Appointment</BookingButton></nav>}
      </header>

      <main>
        <section id="top" className="relative overflow-hidden bg-secondary/35">
          <div className="mx-auto grid max-w-7xl items-center lg:min-h-[560px] lg:grid-cols-[0.86fr_1.14fr]">
            <div className="relative z-10 px-5 py-16 lg:px-8 lg:py-24"><p className="mb-5 text-sm font-semibold uppercase tracking-[0.15em] text-accent">Premium in-home massage & wellness care</p><h1 className="max-w-xl text-balance font-serif text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">Pure Relaxation.<br /><em>True Comfort.</em></h1><p className="mt-6 max-w-md text-pretty leading-relaxed text-muted-foreground">Experience professional massage therapy delivered to the comfort and privacy of your own home.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><BookingButton className="bg-accent text-accent-foreground hover:bg-accent/90">Book an Appointment</BookingButton><Button asChild variant="outline"><a href="#services">Explore Services<ArrowRight data-icon="inline-end" /></a></Button></div></div>
            <div className="relative min-h-[340px] lg:absolute lg:inset-y-0 lg:right-0 lg:w-[57%]"><Image src="/images/spa-hero.png" alt="Woman receiving a relaxing massage in a warm private room" fill priority sizes="(max-width: 1024px) 100vw, 57vw" className="object-cover" /></div>
          </div>
        </section>

        <section className="border-b border-border/70 bg-card"><div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border/70 px-5 py-7 md:grid-cols-4 lg:px-8">{benefits.map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-3 px-4 first:pl-0 last:pr-0 md:px-6"><Icon className="mt-1 size-6 shrink-0 text-accent" /><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block">{text}</p></div></div>)}</div></section>

        <section id="services" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20"><div className="mb-10 text-center"><p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">Our signature treatments</p><h2 className="mt-2 font-serif text-4xl sm:text-5xl">Featured Massage Services</h2><p className="mx-auto mt-3 max-w-xl text-muted-foreground">Personalized care to help you feel restored, balanced, and at home in your body.</p></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{featuredServices.map((service) => { const content = localizedService(service, locale); return <article key={service.id} className="group overflow-hidden rounded-[var(--radius-card)] border border-border bg-card transition-transform hover:-translate-y-1"><div className="relative aspect-[1.35] overflow-hidden"><Image src={service.imageUrl || "/images/spa-massage.png"} alt={content.name} fill sizes="(max-width: 640px) 100vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /></div><div className="flex min-h-44 flex-col p-5"><h3 className="font-serif text-xl">{content.name}</h3><p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{content.description}</p><button onClick={() => openBooking({ serviceId: service.id })} className="mt-auto flex items-center gap-2 pt-4 text-sm font-semibold text-accent">Learn More <ArrowRight data-icon="inline-end" /></button></div></article>})}</div><div className="mt-9 text-center"><Button asChild variant="outline"><a href="#contact">View All Services<ArrowRight data-icon="inline-end" /></a></Button></div></section>

        <section id="therapists" className="bg-secondary/25"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="mb-10 text-center"><p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">Meet your care team</p><h2 className="mt-2 font-serif text-4xl sm:text-5xl">Our Therapists</h2></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featuredTherapists.map((therapist) => <article key={therapist.id} className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card text-center"><div className="relative aspect-[1.1]"><Image src={therapist.photoUrl || "/images/therapist-placeholder.png"} alt={`Lotus Wellness therapist ${therapist.code}`} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" /></div><div className="p-5"><h3 className="font-serif text-xl">{therapist.code}</h3><p className="mt-1 text-sm text-muted-foreground">{therapist.experienceYears ? `${therapist.experienceYears}+ Years Experience` : "Wellness Specialist"}</p><div className="mt-3 flex justify-center gap-1 text-accent" aria-label="5 star rating">{[1,2,3,4,5].map((star) => <Star key={star} className="size-4 fill-current" />)}</div></div></article>)}</div></div></section>

        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="mb-10 text-center"><p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">The Lotus difference</p><h2 className="mt-2 font-serif text-4xl sm:text-5xl">Why Choose Lotus Wellness</h2></div><div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{whyLotus.map(({ icon: Icon, title, text }) => <div key={title} className="text-center"><Icon className="mx-auto size-8 text-accent" /><h3 className="mt-4 font-serif text-xl">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></div>)}</div></section>

        <section className="mx-5 overflow-hidden rounded-[var(--radius-card)] bg-secondary/65 lg:mx-auto lg:flex lg:max-w-7xl"><div className="relative min-h-60 lg:w-1/2"><Image src="/images/spa-oils.png" alt="Premium massage oils, candle, and rolled towel" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div><div className="flex flex-col justify-center p-8 lg:w-1/2 lg:p-14"><h2 className="font-serif text-4xl">Ready to feel better?</h2><p className="mt-3 text-muted-foreground">Let us bring wellness, balance and relaxation to you.</p><div className="mt-6"><BookingButton className="bg-accent text-accent-foreground hover:bg-accent/90">Book an Appointment</BookingButton></div></div></section>

        <section id="about" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24"><div className="relative aspect-[1.25] overflow-hidden rounded-[var(--radius-card)]"><Image src="/images/spa-room.png" alt="Warm Lotus Wellness massage room prepared for a guest" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div><div><p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">A calmer way to care for yourself</p><h2 className="mt-2 font-serif text-4xl sm:text-5xl">About Lotus Wellness</h2><p className="mt-5 leading-relaxed text-muted-foreground">We believe true relaxation begins in the comfort of your home. Our mission is to provide professional massage therapy and wellness care that nourishes your body, calms your mind, and restores your natural balance.</p><ul className="mt-6 grid gap-3 sm:grid-cols-3">{["Personalized Care", "Holistic Approach", "Wellness Focused"].map((item) => <li key={item} className="flex items-center gap-2 text-sm"><Check className="size-4 text-accent" />{item}</li>)}</ul></div></section>

        <section id="contact" className="border-t border-border/70 bg-secondary/20"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="mb-10 text-center"><p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">Kind words from our guests</p><h2 className="mt-2 font-serif text-4xl sm:text-5xl">What Our Clients Say</h2></div><div className="grid gap-5 md:grid-cols-3">{(reviews.length ? reviews.slice(0, 3) : [{ commentEn: "The therapist was professional, punctual and incredibly attentive. It felt like a luxury spa right at home!", name: "Sarah K." }, { commentEn: "Amazing experience! I felt relaxed and ready for a good night's sleep.", name: "David L." }, { commentEn: "Easy booking, excellent service and the best deep tissue massage I have ever had.", name: "Jessica M." }]).map((review, index) => <blockquote key={index} className="rounded-[var(--radius-card)] border border-border bg-card p-6"><div className="font-serif text-4xl leading-none text-accent">“</div><p className="mt-2 text-sm leading-relaxed">{String(review.commentEn || review.comment || "A wonderful wellness experience.")}</p><div className="mt-4 flex gap-1 text-accent">{[1,2,3,4,5].map((star) => <Star key={star} className="size-3 fill-current" />)}</div><cite className="mt-2 block text-sm not-italic font-semibold">{String(review.name || review.authorName || "Lotus guest")}</cite></blockquote>)}</div></div></section>

        <section className="bg-primary px-5 py-16 text-primary-foreground"><div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center"><h2 className="font-serif text-4xl sm:text-5xl">Your better day starts here.</h2><p className="max-w-xl text-primary-foreground/75">A little time for yourself can change everything. Let Lotus Wellness come to you.</p><BookingButton className="bg-accent text-accent-foreground hover:bg-accent/90">Book an Appointment</BookingButton></div></section>
      </main>

      <footer className="border-t border-border bg-secondary/35">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1.25fr_0.8fr_1fr_1fr_0.8fr] lg:px-8 lg:py-14">
          <div className="flex flex-col items-start gap-5">
            <a href="#top" aria-label="Lotus Wellness home"><Image src="/images/lotus-logo.png" alt="Lotus Wellness Massage" width={150} height={70} className="h-20 w-auto object-contain" /></a>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">Professional in-home massage therapy and wellness care, delivered with warmth and thoughtful attention.</p>
          </div>
          <div><h2 className="mb-4 text-sm font-semibold">Quick Links</h2><nav className="flex flex-col items-start gap-2 text-sm text-muted-foreground" aria-label="Footer navigation">{[{ label: "Home", href: "#top" }, { label: "Services", href: "#services" }, { label: "Therapists", href: "#therapists" }, { label: "About", href: "#about" }, { label: "Contact", href: "#contact" }, { label: "FAQ", href: "#contact" }, { label: "Promotions", href: "#services" }].map((link) => <a key={link.label} href={link.href} className="transition-colors hover:text-accent">{link.label}</a>)}</nav></div>
          <div><h2 className="mb-4 text-sm font-semibold">Our Services</h2><nav className="flex flex-col items-start gap-2 text-sm text-muted-foreground" aria-label="Services navigation">{["Massage Therapy", "Aromatherapy", "Hot Stone Therapy", "Body Treatment", "Relaxation Therapy", "Therapeutic Care", "View All Services"].map((item) => <a key={item} href="#services" className="transition-colors hover:text-accent">{item}</a>)}</nav></div>
          <div id="footer-contact"><h2 className="mb-4 text-sm font-semibold">Contact Us</h2><div className="flex flex-col gap-2.5 text-sm text-muted-foreground"><a href="https://wa.me/821026451933" className="flex items-center gap-2 hover:text-accent"><MessageCircle className="size-4 text-accent" />WhatsApp</a><a href="#footer-contact" className="flex items-center gap-2 hover:text-accent"><Send className="size-4 text-accent" />LINE</a><a href="#footer-contact" className="flex items-center gap-2 hover:text-accent"><MessageCircle className="size-4 text-accent" />KakaoTalk</a><a href="#footer-contact" className="flex items-center gap-2 hover:text-accent"><Send className="size-4 text-accent" />Messenger</a><a href="https://instagram.com" className="flex items-center gap-2 hover:text-accent"><Instagram className="size-4 text-accent" />Instagram</a><a href="tel:+821026451933" className="flex items-center gap-2 hover:text-accent"><Phone className="size-4 text-accent" />01026451933</a></div></div>
          <div><h2 className="mb-4 text-sm font-semibold">Follow Us</h2><div className="flex gap-3"><a href="#footer-contact" aria-label="Facebook" className="flex size-9 items-center justify-center rounded-full border border-accent/40 text-accent transition-colors hover:bg-accent hover:text-accent-foreground"><Facebook className="size-4" /></a><a href="https://instagram.com" aria-label="Instagram" className="flex size-9 items-center justify-center rounded-full border border-accent/40 text-accent transition-colors hover:bg-accent hover:text-accent-foreground"><Instagram className="size-4" /></a><a href="#footer-contact" aria-label="YouTube" className="flex size-9 items-center justify-center rounded-full border border-accent/40 text-accent transition-colors hover:bg-accent hover:text-accent-foreground"><Youtube className="size-4" /></a></div></div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-border px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><p>© 2024 Lotus Wellness. All rights reserved.</p><div className="flex gap-5"><a href="#footer-contact" className="hover:text-accent">Privacy Policy</a><span aria-hidden="true">|</span><a href="#footer-contact" className="hover:text-accent">Terms of Service</a></div></div>
      </footer>
    </div>
  )
}

export default HomepageRedesign

