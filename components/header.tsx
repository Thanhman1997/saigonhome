"use client"

import { useState } from "react"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/i18n/language-provider"

export function Header() {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  const links = [
    { label: t.nav.services, href: "#services" },
    { label: t.nav.experts, href: "#experts" },
    { label: t.nav.promotions, href: "#promotions" },
    { label: t.nav.faq, href: "#faq" },
    { label: t.nav.contact, href: "#contact" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <a href="#top" className="group flex items-center gap-3" aria-label="Lotus Wellness home">
          <Image src="/images/lotus-wellness-logo.png" alt="Lotus Wellness Massage" width={150} height={112} priority className="h-16 w-auto scale-125 object-contain mix-blend-multiply sm:h-[4.5rem] sm:scale-110" />
        </a>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-5 lg:flex">
          <LanguageSwitcher />
        </div>
        <button
          className="flex size-11 items-center justify-center lg:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" className="border-t border-border bg-background px-5 py-6 lg:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-5">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="font-serif text-2xl">
                {link.label}
              </a>
            ))}
            <div className="mt-1">
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
