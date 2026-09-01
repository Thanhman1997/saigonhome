"use client"

import { ChevronDown, Check } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-provider"
import { locales, type Locale } from "@/lib/i18n/dictionary"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const active = locales.find((item) => item.code === locale) ?? locales[0]
  const countryFlags = { en: "us", ko: "kr", vi: "vn" } as const

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  function choose(nextLocale: Locale) {
    setLocale(nextLocale)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${active.label}`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-7 translate-x-16 items-center gap-1 rounded-md border border-border bg-background px-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-background hover:shadow-md"
      >
        <img
          src={`https://flagcdn.com/w40/${countryFlags[active.code]}.png`}
          alt={`${active.label} country flag`}
          width={20}
          height={15}
          className="h-[15px] w-5 shrink-0 rounded-[2px] object-cover"
        />
        <span>{active.short}</span>
        <ChevronDown aria-hidden="true" className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div role="listbox" aria-label="Languages" className="absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-40 overflow-hidden rounded-lg border border-border/80 bg-background/95 p-1 shadow-xl backdrop-blur-md">
          {locales.map((item) => (
            <button
              key={item.code}
              type="button"
              role="option"
              aria-selected={locale === item.code}
              aria-current={locale === item.code ? "true" : undefined}
              onClick={() => choose(item.code)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium tracking-normal text-foreground transition-all hover:bg-muted hover:pl-2.5"
            >
              <img
                src={`https://flagcdn.com/w40/${countryFlags[item.code]}.png`}
                alt={`${item.label} country flag`}
                width={20}
                height={15}
className="h-3 w-4 shrink-0 rounded-[2px] object-cover"
              />
              <span className="flex-1">{item.label}</span>
              {locale === item.code && <Check aria-hidden="true" className="size-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
