"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { dictionary, type Locale, type Dictionary } from "./dictionary"

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Dictionary
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const LOCALE_COOKIE = "lotus-wellness-locale"

function readLocaleCookie(): Locale | null {
  const value = document.cookie.split("; ").find((part) => part.startsWith(`${LOCALE_COOKIE}=`))?.split("=")[1]
  return value && Object.prototype.hasOwnProperty.call(dictionary, value) ? (value as Locale) : null
}

export function LanguageProvider({
  children,
  defaultLocale = "en",
}: {
  children: ReactNode
  defaultLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    const stored = readLocaleCookie()
    if (stored) setLocaleState(stored)
  }, [])

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
