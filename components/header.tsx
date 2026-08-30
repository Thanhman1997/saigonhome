"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { pickLocalized, useLanguage } from "@/lib/i18n/language-provider"

type NavigationSetting = { menuKey: string; labelEn: string; labelVi: string; labelKo: string; href: string; visible: boolean; fontFamily?: string; fontSize?: string; fontWeight?: string; textColor?: string; hoverColor?: string }

export function Header({ navigationSettings = [] }: { navigationSettings?: NavigationSetting[] }) {
  const [open, setOpen] = useState(false)
  const { locale, t } = useLanguage()
  const pathname = usePathname()
  const resolveHref = (href: string) => href.startsWith("#") && pathname !== "/" ? `/${href}` : href
  const navigate = (href: string) => {
    const viewTransitionDocument = document as Document & { startViewTransition?: (callback: () => void) => void }
    if (href.startsWith("#") && pathname === "/") {
      const target = document.querySelector(href)
      if (target) {
        if (viewTransitionDocument.startViewTransition) {
          viewTransitionDocument.startViewTransition(() => target.scrollIntoView({ behavior: "smooth", block: "start" }))
        } else {
          target.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        return
      }
    }
    if (viewTransitionDocument.startViewTransition) {
      viewTransitionDocument.startViewTransition(() => { window.location.href = href })
    } else {
      window.location.href = href
    }
  }

  const links = (navigationSettings.length ? navigationSettings : [
    { menuKey: "home", labelEn: "HOME", labelVi: "TRANG CHỦ", labelKo: "홈", href: "#top", visible: true },
    { menuKey: "services", labelEn: t.nav.services, labelVi: t.nav.services, labelKo: t.nav.services, href: "#services", visible: true },
    { menuKey: "experts", labelEn: t.nav.experts, labelVi: t.nav.experts, labelKo: t.nav.experts, href: "#experts", visible: true },
    { menuKey: "about", labelEn: "About", labelVi: "Giới thiệu", labelKo: "소개", href: "#about", visible: true },
    { menuKey: "reviews", labelEn: "Reviews", labelVi: "Đánh giá", labelKo: "후기", href: "/reviews", visible: true },
    { menuKey: "contact", labelEn: t.nav.contact, labelVi: t.nav.contact, labelKo: t.nav.contact, href: "#contact", visible: true },
  ]).filter((link) => link.visible).map((link) => ({ ...link, label: pickLocalized({ en: link.labelEn, vi: link.labelVi, ko: link.labelKo }, locale) }))

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-5 lg:px-8">
        <a href={resolveHref("#top")} className="group flex items-center" aria-label="Lotus Wellness home">
          <Image src="/images/lotus-wellness-logo.png" alt="Lotus Wellness Massage" width={150} height={112} priority className="h-20 w-auto object-contain sm:h-24" style={{ mixBlendMode: "darken" }} />
        </a>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <a
              key={link.href}
              href={resolveHref(link.href)}
              onClick={(event) => { event.preventDefault(); navigate(resolveHref(link.href)) }}
              className={`relative tracking-[0.08em] transition-colors ${link.label === "HOME" ? "text-accent after:absolute after:-bottom-3 after:left-0 after:h-0.5 after:w-7 after:bg-accent" : "text-foreground/80"}`}
              style={{ fontFamily: link.fontFamily === "inherit" ? undefined : link.fontFamily, fontSize: link.fontSize === "lg" ? "1.125rem" : link.fontSize === "md" ? "1rem" : "0.75rem", fontWeight: link.fontWeight === "bold" ? 700 : 500, color: link.textColor === "inherit" ? undefined : link.textColor }}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <button
          className="flex size-11 items-center justify-center lg:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <div className="hidden lg:flex">
          <LanguageSwitcher />
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" className="border-t border-border bg-background px-5 py-6 lg:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-5">
            {links.map((link) => (
              <a key={link.href} href={resolveHref(link.href)} onClick={(event) => { event.preventDefault(); setOpen(false); navigate(resolveHref(link.href)) }} className="font-serif text-2xl" style={{ fontFamily: link.fontFamily === "inherit" ? undefined : link.fontFamily, fontSize: link.fontSize === "lg" ? "1.5rem" : link.fontSize === "md" ? "1.25rem" : "1rem", fontWeight: link.fontWeight === "bold" ? 700 : 500, color: link.textColor === "inherit" ? undefined : link.textColor }}>
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
