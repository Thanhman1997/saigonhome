"use client"

import Image from "next/image"
import { Phone } from "lucide-react"
import { SiInstagram, SiKakaotalk } from "react-icons/si"
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
    contactInfo?.instagramUrl && normalizeContactUrl(contactInfo.instagramUrl) && { label: "Instagram", href: normalizeContactUrl(contactInfo.instagramUrl)!, icon: <SiInstagram className="size-8 text-instagram" aria-hidden="true" /> },
    { label: CONTACT_PHONE, href: `tel:${CONTACT_PHONE}`, icon: <Phone className="size-8 text-blue-300" aria-hidden="true" /> },
  ].filter(Boolean) as { label: string; href: string; icon: React.ReactNode }[]

  return <section id="contact" className="bg-lotus-pink py-20 font-sans text-lotus-pink-foreground lg:py-24"><div className="mx-auto max-w-[88rem] px-5 lg:px-16"><div className="mx-auto max-w-3xl text-center"><p className="font-sans text-sm font-semibold uppercase tracking-[0.22em] text-lotus-pink-foreground sm:text-base">{t.kicker}</p><h2 className="mt-5 text-balance section-heading">{t.title}</h2>{t.subtitle && <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-lotus-pink-foreground/80 sm:text-base">{t.subtitle}</p>}</div>{channels.length > 0 && <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-4">{channels.map((c, idx) => <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className={`flex ${idx === channels.length - 1 ? "items-end" : "items-center"} justify-center gap-2 rounded-full border border-accent-foreground/20 px-4 py-2 text-sm font-medium text-lotus-pink-foreground/90 transition-all hover:-translate-y-0.5 hover:border-accent-foreground/45 hover:text-lotus-pink-foreground sm:text-base`}>{c.icon}{c.label}</a>)}</div>}</div></section>
}
