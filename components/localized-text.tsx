"use client"

import { useLanguage } from "@/lib/i18n/language-provider"
import type { Locale } from "@/lib/i18n/dictionary"

/** Renders server-provided copy in the active language so crawlers get the right text on /vi and /ko URLs. */
export function LocalizedText({ text }: { text: Record<Locale, string> }) {
  const { locale } = useLanguage()
  return <>{text[locale] || text.en}</>
}
