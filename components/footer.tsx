import Image from "next/image"
import { Clock3, Facebook, Instagram, MapPin, Phone, Youtube } from "lucide-react"
import { getContactInfo } from "@/lib/data"

type ContactInfo = Awaited<ReturnType<typeof getContactInfo>>

export function Footer({ contactInfo }: { contactInfo: ContactInfo }) {
  const contactMethods = [
    contactInfo?.whatsappUrl && { label: "WhatsApp", href: contactInfo.whatsappUrl, icon: "/images/contact-whatsapp.png" },
    contactInfo?.lineUrl && { label: "LINE", href: contactInfo.lineUrl, icon: "/images/contact-line.png" },
    contactInfo?.kakaoUrl && { label: "KakaoTalk", href: contactInfo.kakaoUrl, icon: "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/kakaotalk/default.svg" },
    contactInfo?.messengerUrl && { label: "Messenger", href: contactInfo.messengerUrl, icon: "/images/contact-messenger.png" },
    contactInfo?.instagramUrl && { label: "Instagram", href: contactInfo.instagramUrl, icon: "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/instagram/default.svg" },
  ].filter(Boolean) as { label: string; href: string; icon: string | null }[]

  return (
    <footer className="border-t border-border bg-secondary px-5 py-10 text-foreground lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.15fr_0.9fr_1fr_1.35fr]">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Image src="/images/lotus-wellness-logo.png" alt="Lotus Wellness Massage" width={180} height={140} className="h-24 w-auto object-contain" style={{ mixBlendMode: "darken" }} />
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">Professional in-home massage and wellness care, delivered with warmth, privacy, and natural balance.</p>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-4 text-accent" aria-hidden="true" />Ho Chi Minh City, Vietnam</p>
          <div className="mt-4 flex items-center gap-3" aria-label="Social media links">
            <a href="#contact" aria-label="Facebook" className="grid size-8 place-items-center rounded-full border border-border text-accent transition-colors hover:bg-accent hover:text-accent-foreground"><Facebook className="size-4" /></a>
            {contactInfo?.instagramUrl && <a href={contactInfo.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-8 place-items-center rounded-full border border-border text-accent transition-colors hover:bg-accent hover:text-accent-foreground"><Instagram className="size-4" /></a>}
            <a href="#contact" aria-label="YouTube" className="grid size-8 place-items-center rounded-full border border-border text-accent transition-colors hover:bg-accent hover:text-accent-foreground"><Youtube className="size-4" /></a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">© 2026 Lotus Wellness. All rights reserved.</p>
        </div>
        <div>
          <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-foreground">SERVICES</h2>
          <nav className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground" aria-label="Services navigation">
            <a href="#services" className="transition-colors hover:text-accent">Massage</a>
            <a href="#services" className="transition-colors hover:text-accent">Aroma Massage</a>
            <a href="#services" className="transition-colors hover:text-accent">Deep Tissue</a>
            <a href="#services" className="transition-colors hover:text-accent">Couple Massage</a>
            <a href="#services" className="transition-colors hover:text-accent">Foot Massage</a>
          </nav>
        </div>
        <div>
          <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-foreground">ABOUT</h2>
          <nav className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground" aria-label="About navigation">
            <a href="#about" className="transition-colors hover:text-accent">About Us</a>
            <a href="#about" className="transition-colors hover:text-accent">Our Space</a>
            <a href="#experts" className="transition-colors hover:text-accent">Therapists</a>
            <a href="#contact" className="transition-colors hover:text-accent">Reviews</a>
            <a href="#faq" className="transition-colors hover:text-accent">FAQ</a>
          </nav>
        </div>
        <div id="contact" className="border-l border-border/70 pl-6">
          <h2 className="font-serif text-lg text-foreground">Contact Us</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            {contactMethods.map((method) => <a key={method.label} href={method.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 transition-colors hover:text-accent">{method.icon ? <img src={method.icon} alt="" width={22} height={22} className="size-5 object-contain" style={{ mixBlendMode: "multiply" }} /> : <span className="grid size-5 place-items-center rounded-full border border-accent/70 text-[8px] font-semibold text-accent">{method.label.slice(0, 1)}</span>}{method.label}</a>)}
            <a href={`tel:${contactInfo?.phone ?? "01026451933"}`} className="flex items-center gap-3 transition-colors hover:text-accent"><Phone className="size-5 text-blue-600" aria-hidden="true" />01026451934</a>
            <p className="flex items-center gap-3"><MapPin className="size-5 text-accent" aria-hidden="true" />{contactInfo?.addressEn ?? "Ho Chi Minh City, Vietnam"}</p>
            <p className="flex items-center gap-3 text-xs text-accent"><Clock3 className="size-5" aria-hidden="true" />Open daily · 7AM–11PM</p>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-3 border-t border-border/70 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Lotus Wellness Massage · Professional care delivered to you</p>
        <div className="flex gap-5"><a href="#" className="hover:text-accent">Privacy Policy</a><a href="#" className="hover:text-accent">Terms of Service</a></div>
      </div>
    </footer>
  )
}
