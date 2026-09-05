"use client"

import Image from "next/image"
import { Phone } from "lucide-react"
import { SiKakaotalk } from "react-icons/si"
import { useLanguage } from "@/lib/i18n/language-provider"
import type { getContactInfo } from "@/lib/data"

type ContactInfoRow = Awaited<ReturnType<typeof getContactInfo>>
const CONTACT_PHONE = "01026451934"

function normalizeContactUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^(tel:|mailto:)/i.test(trimmed)) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function ContactSection({ contactInfo }: { contactInfo: ContactInfoRow }) {
  const { t: dict } = useLanguage()
  const t = dict.contact
  const channels = [
    contactInfo?.whatsappUrl && normalizeContactUrl(contactInfo.whatsappUrl) && { label: "WhatsApp", href: normalizeContactUrl(contactInfo.whatsappUrl)!, icon: <Image src="/images/contact-whatsapp.png" alt="" width={28} height={28} className="size-9 rounded-md object-contain" /> },
    contactInfo?.lineUrl && normalizeContactUrl(contactInfo.lineUrl) && { label: "LINE", href: normalizeContactUrl(contactInfo.lineUrl)!, icon: <Image src="/images/contact-line.png" alt="" width={28} height={28} className="size-9 rounded-md object-cover" /> },
    contactInfo?.kakaoUrl && normalizeContactUrl(contactInfo.kakaoUrl) && { label: "KakaoTalk", href: normalizeContactUrl(contactInfo.kakaoUrl)!, icon: <SiKakaotalk className="size-8 text-kakaotalk" aria-hidden="true" /> },
    contactInfo?.messengerUrl && normalizeContactUrl(contactInfo.messengerUrl) && { label: "Messenger", href: normalizeContactUrl(contactInfo.messengerUrl)!, icon: <Image src="/images/contact-messenger.png" alt="" width={28} height={28} className="size-9 rounded-md object-cover" /> },
    contactInfo?.instagramUrl && normalizeContactUrl(contactInfo.instagramUrl) && { label: "Instagram", href: normalizeContactUrl(contactInfo.instagramUrl)!, icon: <Image src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/instagram/default.svg" alt="" width={32} height={32} unoptimized className="size-8 object-contain" /> },
    { label: CONTACT_PHONE, href: `tel:${CONTACT_PHONE}`, icon: <Phone className="size-8 text-blue-300" aria-hidden="true" /> },
  ].filter(Boolean) as { label: string; href: string; icon: React.ReactNode }[]

  return <section id="contact" className="bg-lotus-pink py-16 font-sans text-lotus-pink-foreground lg:py-20"><div className="mx-auto max-w-[88rem] px-5 lg:px-10"><div className="mx-auto max-w-3xl text-center"><p className="font-sans text-2xl font-bold uppercase tracking-[0.14em] text-lotus-pink-foreground sm:text-3xl">{t.kicker}</p><h2 className="mt-5 text-balance font-sans text-lg font-semibold leading-relaxed tracking-tight sm:text-xl lg:text-2xl">{t.title}</h2>{t.subtitle && <p className="mx-auto mt-5 max-w-2xl text-[2px] leading-relaxed text-lotus-pink-foreground/80">{t.subtitle}</p>}</div>{channels.length > 0 && <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-4">{channels.map((c) => <a key={c.label} href={c.href} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-sm font-medium text-lotus-pink-foreground/95 transition-colors hover:text-lotus-pink-foreground sm:text-base">{c.icon}{c.label}</a>)}</div>}</div></section>
}
