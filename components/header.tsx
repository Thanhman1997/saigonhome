"use client"

import { useEffect, useState } from "react"
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
  const [activeSection, setActiveSection] = useState(pathname === "/" ? "home" : "")

  useEffect(() => {
    if (pathname !== "/") return
    const sectionIds = ["top", "services", "experts", "faq", "reviews", "contact"]
    const updateActiveSection = () => {
      const visibleSections = sectionIds
        .map((id) => ({ id, top: document.getElementById(id)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY }))
        .filter((section) => section.top <= 160)
      const current = visibleSections.at(-1)?.id ?? "top"
      setActiveSection(current === "top" ? "home" : current)
    }
    updateActiveSection()
    window.addEventListener("scroll", updateActiveSection, { passive: true })
    return () => window.removeEventListener("scroll", updateActiveSection)
  }, [pathname])

  const resolveHref = (href: string, menuKey?: string) => {
    if (menuKey === "services") return "/services"
    return href.startsWith("#") && pathname !== "/" ? `/${href}` : href
  }
  const isActive = (link: { menuKey: string; href: string }) => pathname === "/" ? (link.href.startsWith("#") ? activeSection === link.menuKey : false) : (link.menuKey === "services" ? pathname === "/services" : link.href.startsWith("/") && pathname.startsWith(link.href))
  const navigate = (href: string) => {
    if (href.startsWith("#") && pathname === "/") {
      const target = document.querySelector(href)
      if (target) {
        const headerOffset = 96
        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset
        window.scrollTo({ top, behavior: "auto" })
      }
      setOpen(false)
      setActiveSection(href === "#top" ? "home" : href.slice(1))
      return
    }
    window.location.assign(href)
  }

  const defaultLinks: NavigationSetting[] = [
    { menuKey: "home", labelEn: "HOME", labelVi: "TRANG CHỦ", labelKo: "홈", href: "#top", visible: true },
    { menuKey: "services", labelEn: t.nav.services, labelVi: t.nav.services, labelKo: t.nav.services, href: "#services", visible: true },
    { menuKey: "experts", labelEn: t.nav.experts, labelVi: t.nav.experts, labelKo: t.nav.experts, href: "#experts", visible: true },
    { menuKey: "faq", labelEn: t.nav.faq, labelVi: t.nav.faq, labelKo: t.nav.faq, href: "#faq", visible: true },
    { menuKey: "reviews", labelEn: t.nav.reviews, labelVi: t.nav.reviews, labelKo: t.nav.reviews, href: "/reviews", visible: true },
    { menuKey: "contact", labelEn: t.nav.contact, labelVi: t.nav.contact, labelKo: t.nav.contact, href: "#contact", visible: true },
  ]
  const allowedMenuKeys = new Set(["home", "services", "experts", "contact", "faq", "reviews"])
  const configuredKeys = new Set(navigationSettings.map((link) => link.menuKey))
  const links = [...navigationSettings.filter((link) => allowedMenuKeys.has(link.menuKey)), ...defaultLinks.filter((link) => !configuredKeys.has(link.menuKey))]
    .filter((link) => allowedMenuKeys.has(link.menuKey) && link.visible)
    .map((link) => ({ ...link, label: pickLocalized({ en: link.labelEn, vi: link.labelVi, ko: link.labelKo }, locale) }))

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-5 lg:px-8">
        <a href="#top" onClick={(event) => { event.preventDefault(); navigate("#top") }} className="group flex -translate-x-16 items-center" aria-label="Lotus Wellness home">
          <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ctVp17KBG47Gf3slo2vkFOzNoBGmVU.png" alt="Lotus Wellness Massage" width={150} height={112} priority className="h-20 w-auto object-contain sm:h-24" />
        </a>
        <nav className="hidden translate-x-16 items-center gap-7 lg:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <a
              key={link.href}
              href={resolveHref(link.href, link.menuKey)}
              onClick={(event) => { event.preventDefault(); navigate(resolveHref(link.href, link.menuKey)) }}
              className={`relative tracking-[0.08em] transition-colors ${locale === "en" || locale === "vi" ? "uppercase" : ""} ${isActive(link) ? "text-accent after:absolute after:-bottom-3 after:left-0 after:h-0.5 after:w-7 after:bg-accent" : "text-foreground/80"}`}
              style={{ fontFamily: locale === "en" ? '"Trebuchet MS", Arial, sans-serif' : link.fontFamily === "inherit" ? undefined : link.fontFamily, fontSize: locale === "vi" ? (link.fontSize === "lg" ? "1.15rem" : link.fontSize === "md" ? "1.05rem" : "0.95rem") : locale === "en" ? (link.fontSize === "lg" ? "1.5rem" : link.fontSize === "md" ? "1.35rem" : "1.05rem") : (link.fontSize === "lg" ? "2.25rem" : link.fontSize === "md" ? "2rem" : "1.5rem"), fontWeight: 800, color: isActive(link) ? "var(--accent)" : link.textColor === "inherit" ? undefined : link.textColor }}
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
              <a key={link.href} href={resolveHref(link.href, link.menuKey)} onClick={(event) => { event.preventDefault(); setOpen(false); navigate(resolveHref(link.href, link.menuKey)) }} className={`font-serif text-4xl font-bold ${locale === "en" ? "uppercase" : ""} ${isActive(link) ? "text-accent" : "text-foreground"}`} style={{ fontFamily: link.fontFamily === "inherit" ? undefined : link.fontFamily, fontSize: locale === "vi" ? (link.fontSize === "lg" ? "2.2rem" : link.fontSize === "md" ? "1.9rem" : "1.6rem") : locale === "en" ? (link.fontSize === "lg" ? "2.7rem" : link.fontSize === "md" ? "2.25rem" : "1.8rem") : (link.fontSize === "lg" ? "3rem" : link.fontSize === "md" ? "2.5rem" : "2rem"), fontWeight: 800, color: isActive(link) || link.textColor === "inherit" ? undefined : link.textColor }}>
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
