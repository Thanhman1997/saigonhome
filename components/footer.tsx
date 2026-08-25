"use client"

import Image from "next/image"
export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary px-5 py-12 text-foreground lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Image src="/images/lotus-wellness-logo.png" alt="Lotus Wellness Massage" width={180} height={140} className="h-28 w-auto mix-blend-multiply" />
          <p className="mt-4 max-w-xs text-xs leading-6 text-muted-foreground">Professional in-home massage and wellness care, delivered with warmth and privacy.</p>
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
            <a href="#services" className="transition-colors hover:text-accent">View All Services</a>
          </nav>
        </div>
        <div id="contact">
          <h2 className="font-serif text-lg text-foreground">Contact Us</h2>
          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
            <a href="https://wa.me/84901234567" className="transition-colors hover:text-accent">WhatsApp</a>
            <a href="tel:+84901234567" className="transition-colors hover:text-accent">+84 90 123 4567</a>
            <a href="mailto:hello@lotuswellness.vn" className="transition-colors hover:text-accent">hello@lotuswellness.vn</a>
            <p>Ho Chi Minh City, Vietnam</p>
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
