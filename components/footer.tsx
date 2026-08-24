"use client"

import Image from "next/image"
import { Mail, Phone } from "lucide-react"
import { SiInstagram, SiKakaotalk } from "react-icons/si"
import { useLanguage } from "@/lib/i18n/language-provider"
import type { getContactInfo } from "@/lib/data"

type ContactInfoRow = Awaited<ReturnType<typeof getContactInfo>>

type ContactLink = {
  label: string
  href: string
  icon: React.ReactNode
}

export function Footer({ contactInfo }: { contactInfo: ContactInfoRow }) {
  const { t, locale } = useLanguage()
  const address = locale === "vi" ? contactInfo?.addressVi : locale === "ko" ? contactInfo?.addressKo : contactInfo?.addressEn
  const phoneHref = contactInfo?.phone ? `tel:${contactInfo.phone.replace(/\s/g, "")}` : null
  const emailHref = contactInfo?.email ? `mailto:${contactInfo.email}` : null

  const contacts = [
    contactInfo?.whatsappUrl && { label: "WhatsApp", href: contactInfo.whatsappUrl, icon: <Image src="/images/contact-whatsapp.png" alt="" width={16} height={16} className="size-4 object-contain" /> },
    contactInfo?.lineUrl && { label: "LINE", href: contactInfo.lineUrl, icon: <Image src="/images/contact-line.png" alt="" width={16} height={16} className="size-4 object-contain" /> },
    contactInfo?.kakaoUrl && { label: "KakaoTalk", href: contactInfo.kakaoUrl, icon: <SiKakaotalk aria-hidden="true" className="size-4 text-kakaotalk" /> },
    contactInfo?.messengerUrl && { label: "Messenger", href: contactInfo.messengerUrl, icon: <Image src="/images/contact-messenger.png" alt="" width={16} height={16} className="size-4 object-contain" /> },
    contactInfo?.instagramUrl && { label: "Instagram", href: contactInfo.instagramUrl, icon: <SiInstagram aria-hidden="true" className="size-4 text-accent" /> },
    phoneHref && { label: contactInfo?.phone ?? "", href: phoneHref, icon: <Phone aria-hidden="true" className="size-4 text-accent" /> },
    emailHref && { label: contactInfo?.email ?? "", href: emailHref, icon: <Mail aria-hidden="true" className="size-4 text-accent" /> },
  ].filter(Boolean) as ContactLink[]

  const services = ["Massage Therapy", "Aromatherapy", "Hot Stone Therapy", "Body Treatment", "Relaxation Therapy", "Therapeutic Care"]

  return (
    <footer id="contact" className="border-t border-border bg-secondary/25 text-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.75fr_1fr_1.15fr_0.8fr] lg:px-8">
        <div className="flex flex-col items-start">
          <a href="#top" aria-label="Lotus Wellness home">
            <Image src="/images/lotus-wellness-brand-logo.png" alt="Lotus Wellness Massage" width={180} height={180} className="h-28 w-auto object-contain" />
          </a>
          {address && <p className="mt-3 max-w-48 text-xs leading-relaxed text-muted-foreground">{address}</p>}
        </div>

        <div>
          <h2 className="text-sm font-semibold">Quick Links</h2>
          <nav className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
            <a href="#top">Home</a><a href="#services">{t.nav.services}</a><a href="#experts">{t.nav.experts}</a><a href="#about">About</a><a href="#contact">Contact</a><a href="#faq">FAQ</a><a href="#promotions">Promotions</a>
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Our Services</h2>
          <nav className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
            {services.map((service) => <a key={service} href="#services">{service}</a>)}
            <a href="#services">View All Services</a>
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Contact Us</h2>
          <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
            {contacts.map((contact) => (
              <a key={contact.label} href={contact.href} target={contact.href.startsWith("http") ? "_blank" : undefined} rel={contact.href.startsWith("http") ? "noreferrer" : undefined} className="flex items-center gap-2 transition-colors hover:text-foreground">
                {contact.icon}<span className="break-all">{contact.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Follow Us</h2>
          <div className="mt-4 flex gap-3">
            {contactInfo?.instagramUrl && <a href={contactInfo.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-9 place-items-center rounded-full border border-accent/35 text-accent transition-colors hover:bg-accent hover:text-accent-foreground"><SiInstagram aria-hidden="true" className="size-4" /></a>}
            {contactInfo?.messengerUrl && <a href={contactInfo.messengerUrl} target="_blank" rel="noreferrer" aria-label="Messenger" className="grid size-9 place-items-center rounded-full border border-accent/35 transition-colors hover:bg-accent"><Image src="/images/contact-messenger.png" alt="" width={18} height={18} className="size-4 object-contain" /></a>}
          </div>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© 2026 Lotus Wellness. All rights reserved.</p>
          <div className="flex gap-5"><a href="#top">Privacy Policy</a><span aria-hidden="true">|</span><a href="#top">Terms of Service</a></div>
        </div>
      </div>
    </footer>
  )
}
