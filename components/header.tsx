"use client"

import Image from "next/image"
import { useState } from "react"
import { CalendarDays, Menu, X } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/lib/booking-context"
import { useLanguage } from "@/lib/i18n/language-provider"

export function Header() {
  const [open, setOpen] = useState(false)
  const { openBooking } = useBooking()
  const { t, locale } = useLanguage()
  const home = locale === "ko" ? "홈" : locale === "vi" ? "Trang chủ" : "Home"
  const about = locale === "ko" ? "소개" : locale === "vi" ? "Về chúng tôi" : "About"

  const links = [
    { label: home, href: "#top" },
    { label: t.nav.services, href: "#services" },
    { label: t.nav.experts, href: "#experts" },
    { label: about, href: "#about" },
    { label: t.nav.contact, href: "#contact" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:h-24 lg:px-8">
        <a href="#top" className="flex shrink-0 items-center" aria-label="Lotus Wellness home">
          <Image
            src="/images/lotus-wellness-brand-logo.png"
            alt="Lotus Wellness Massage — Massage delivered to you"
            width={220}
            height={220}
            priority
            className="h-16 w-auto object-contain lg:h-20"
          />
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <Button onClick={() => openBooking()}>
            <CalendarDays data-icon="inline-start" />
            {t.hero.cta}
          </Button>
        </div>

        <button className="grid size-11 place-items-center rounded-full border border-border lg:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" className="border-t border-border bg-background px-5 py-6 lg:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-5">
            {links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="font-serif text-2xl">{link.label}</a>)}
            <div className="flex items-center justify-between border-t border-border pt-5">
              <LanguageSwitcher />
              <Button onClick={() => { setOpen(false); openBooking() }}><CalendarDays data-icon="inline-start" />{t.hero.cta}</Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
