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
  const countryCodes = { en: "US", ko: "KR", vi: "VN" } as const

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
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border/80 bg-background/90 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-muted hover:shadow-md"
      >
        <span
          aria-hidden="true"
          title={active.label}
          className="inline-flex aspect-[3/2] w-6 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-foreground/10 bg-primary/10 font-mono text-[0.65rem] font-bold leading-none text-primary shadow-sm"
        >
          {countryCodes[active.code]}
        </span>
        <span>{active.short}</span>
        <ChevronDown aria-hidden="true" className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div role="listbox" aria-label="Languages" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-48 overflow-hidden rounded-xl border border-border/80 bg-background/95 p-2 shadow-xl backdrop-blur-md">
          {locales.map((item) => (
            <button
              key={item.code}
              type="button"
              role="option"
              aria-selected={locale === item.code}
              aria-current={locale === item.code ? "true" : undefined}
              onClick={() => choose(item.code)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium tracking-normal text-foreground transition-all hover:bg-muted hover:pl-3.5"
            >
              <span
                aria-hidden="true"
                title={item.label}
                className="inline-flex aspect-[3/2] w-6 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-foreground/10 bg-primary/10 font-mono text-[0.65rem] font-bold leading-none text-primary shadow-sm"
              >
                {countryCodes[item.code]}
              </span>
              <span className="flex-1">{item.label}</span>
              {locale === item.code && <Check aria-hidden="true" className="size-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
