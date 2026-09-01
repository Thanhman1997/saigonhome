"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { dictionary, type Locale, type Dictionary } from "./dictionary"

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Dictionary
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = "lotus-wellness-locale"

export function LanguageProvider({
  children,
  defaultLocale = "en",
}: {
  children: ReactNode
  defaultLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return defaultLocale
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null
    return stored && Object.prototype.hasOwnProperty.call(dictionary, stored) ? stored : defaultLocale
  })

  function setLocale(next: Locale) {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: dictionary[locale] }}>
      <div className={locale === "vi" ? "locale-vi" : undefined}>{children}</div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}

export function pickLocalized<T extends { en: string; ko: string; vi: string } | Record<string, string>>(
  obj: T,
  locale: Locale,
): string {
  const key = locale as keyof T
  return (obj[key] as unknown as string) ?? obj.en
}
