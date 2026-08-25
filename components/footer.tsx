"use client"

import Image from "next/image"
import { Clock3, Mail, MapPin, Phone } from "lucide-react"
export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary px-5 py-10 text-foreground lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.25fr_1fr_1fr_1.15fr]">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Image src="/images/lotus-wellness-logo.png" alt="Lotus Wellness Massage" width={180} height={140} className="h-24 w-auto object-contain" style={{ mixBlendMode: "darken" }} />
          <p className="mt-3 max-w-xs text-xs leading-5 text-muted-foreground">© 2024 Lotus Wellness. All rights reserved.</p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-foreground">Quick Links</h2>
          <nav className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground" aria-label="Footer navigation">
            <a href="#top" className="transition-colors hover:text-accent">Home</a>
            <a href="#services" className="transition-colors hover:text-accent">Services</a>
            <a href="#experts" className="transition-colors hover:text-accent">Therapists</a>
            <a href="#about" className="transition-colors hover:text-accent">About</a>
            <a href="#contact" className="transition-colors hover:text-accent">Contact</a>
          </nav>
        </div>
        <div>
          <h2 className="font-serif text-lg text-foreground">Our Services</h2>
          <nav className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground" aria-label="Services navigation">
            <a href="#services" className="transition-colors hover:text-accent">Massage Therapy</a>
            <a href="#services" className="transition-colors hover:text-accent">Aromatherapy</a>
            <a href="#services" className="transition-colors hover:text-accent">Hot Stone Therapy</a>
            <a href="#services" className="transition-colors hover:text-accent">Body Treatment</a>
            <a href="#services" className="transition-colors hover:text-accent">Relaxation Therapy</a>
            <a href="#services" className="transition-colors hover:text-accent">Therapeutic Care</a>
            <a href="#services" className="transition-colors hover:text-accent">View All Services</a>
          </nav>
        </div>
        <div id="contact">
          <h2 className="font-serif text-lg text-foreground">Contact Us</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            <a href="https://wa.me/84901234567" className="flex items-center gap-3 transition-colors hover:text-accent"><Phone className="size-4 text-accent" aria-hidden="true" />WhatsApp</a>
            <a href="tel:+84901234567" className="flex items-center gap-3 transition-colors hover:text-accent"><Phone className="size-4 text-accent" aria-hidden="true" />+84 90 123 4567</a>
            <a href="mailto:hello@lotuswellness.vn" className="flex items-center gap-3 transition-colors hover:text-accent"><Mail className="size-4 text-accent" aria-hidden="true" />hello@lotuswellness.vn</a>
            <p className="flex items-center gap-3"><MapPin className="size-4 text-accent" aria-hidden="true" />Ho Chi Minh City, Vietnam</p>
            <p className="flex items-center gap-3 pt-1 text-xs text-accent"><Clock3 className="size-4" aria-hidden="true" />Open daily · 7AM–11PM</p>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-border/70 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Lotus Wellness. All rights reserved.</p>
        <div className="flex gap-5"><a href="#" className="hover:text-accent">Privacy Policy</a><a href="#" className="hover:text-accent">Terms of Service</a></div>
      </div>
    </footer>
  )
}
