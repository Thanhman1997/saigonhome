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
    { label: "Home", href: "#top" },
    { label: t.nav.services, href: "#services" },
    { label: t.nav.experts, href: "#experts" },
    { label: "About", href: "#about" },
    { label: t.nav.contact, href: "#contact" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-[4.75rem] max-w-6xl items-center justify-between px-5 lg:px-8">
        <a href="#top" className="group flex items-center gap-3" aria-label="Lotus Wellness home">
          <Image src="/images/lotus-wellness-logo.png" alt="Lotus Wellness Massage" width={150} height={112} priority className="h-16 w-auto object-contain sm:h-[4.5rem]"
            style={{ mixBlendMode: "multiply" }} />
        </a>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`relative text-xs font-medium tracking-[0.08em] transition-colors hover:text-accent ${link.label === "Home" ? "text-accent after:absolute after:-bottom-3 after:left-0 after:h-0.5 after:w-7 after:bg-accent" : "text-foreground/80"}`}
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
