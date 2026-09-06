"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { dictionary, type Locale, type Dictionary } from "./dictionary"

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Dictionary
}

const LanguageContext = createContext<LanguageContextValue | null>(null)
const LOCALE_COOKIE = "lotus-wellness-locale"

export function LanguageProvider({
  children,
  defaultLocale = "en",
}: {
  children: ReactNode
  defaultLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  function setLocale(next: Locale) {
    setLocaleState(next)
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`
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
