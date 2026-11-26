"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { dictionary, type Locale, type Dictionary } from "./dictionary"

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Dictionary
}

const defaultLanguageContext: LanguageContextValue = {
  locale: "en",
  setLocale: () => undefined,
  t: dictionary.en,
}

const LanguageContext = createContext<LanguageContextValue>(defaultLanguageContext)
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
    // Keep a /vi or /ko URL in step with the chosen language so a reload does not flip it back.
    const { pathname, search, hash } = window.location
    if (/^\/(en|vi|ko)(?=\/|$)/.test(pathname)) {
      window.history.replaceState(window.history.state, "", `${pathname.replace(/^\/(en|vi|ko)(?=\/|$)/, `/${next}`)}${search}${hash}`)
    }
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: dictionary[locale] }}>
      <div className={locale === "vi" ? "locale-vi" : undefined}>{children}</div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export function pickLocalized<T extends { en: string; ko: string; vi: string } | Record<string, string>>(
  obj: T,
  locale: Locale,
): string {
  const key = locale as keyof T
  return (obj[key] as unknown as string) ?? obj.en
}
