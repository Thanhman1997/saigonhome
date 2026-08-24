"use client"

import { Flower2, Instagram, Mail, MapPin, Phone } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-provider"

export function Footer() {
  const { t, locale } = useLanguage()
  const description = locale === "vi" ? "Dịch vụ massage tại nhà riêng tư, chỉn chu tại Thành phố Hồ Chí Minh." : locale === "ko" ? "호치민에서 만나는 프라이빗하고 세심한 방문 마사지." : "Private, considered mobile massage across Ho Chi Minh City."
  return (
    <footer id="contact" className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 lg:grid-cols-4 lg:px-8 lg:py-16">
        <div><div className="flex items-center gap-3"><Flower2 className="size-7 text-secondary" /><span className="font-serif text-2xl">Lotus Wellness</span></div><p className="mt-5 max-w-xs text-sm leading-relaxed text-primary-foreground/65">{description}</p></div>
        <div><h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Explore</h2><nav className="mt-5 flex flex-col gap-3 text-sm text-primary-foreground/70"><a href="#services">{t.nav.services}</a><a href="#experts">{t.nav.experts}</a><a href="#about">About</a><a href="#faq">{t.nav.faq}</a></nav></div>
        <div><h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Contact</h2><div className="mt-5 flex flex-col gap-3 text-sm text-primary-foreground/70"><a href="tel:01026451933" className="flex items-center gap-2"><Phone className="size-4" />010 2645 1933</a><a href="mailto:hello@lotuswellness.vn" className="flex items-center gap-2"><Mail className="size-4" />hello@lotuswellness.vn</a><p className="flex items-center gap-2"><MapPin className="size-4" />Ho Chi Minh City</p></div></div>
        <div><h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Follow</h2><a href="#top" className="mt-5 inline-flex items-center gap-2 text-sm text-primary-foreground/70"><Instagram className="size-4" />Instagram</a></div>
      </div>
      <div className="border-t border-primary-foreground/15"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-primary-foreground/50 sm:flex-row sm:items-center sm:justify-between lg:px-8"><p>© 2026 Lotus Wellness. All rights reserved.</p><div className="flex gap-5"><a href="#top">Privacy</a><a href="#top">Terms</a></div></div></div>
    </footer>
  )
}
