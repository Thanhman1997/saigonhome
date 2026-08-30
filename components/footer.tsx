import Image from "next/image"
import { Clock3, Facebook, MapPin, Youtube } from "lucide-react"
import { getContactInfo } from "@/lib/data"

type ContactInfo = Awaited<ReturnType<typeof getContactInfo>>

export function Footer({ contactInfo }: { contactInfo: ContactInfo }) {
  return (
    <footer className="border-t border-border bg-secondary px-5 py-10 font-sans text-sm text-foreground lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Image src="/images/lotus-wellness-logo.png" alt="Lotus Wellness Massage" width={180} height={140} className="h-24 w-auto object-contain" style={{ mixBlendMode: "darken" }} />
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">Professional in-home massage and wellness care, delivered with warmth, privacy, and natural balance.</p>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-4 text-accent" aria-hidden="true" />Ho Chi Minh City, Vietnam</p>
          <div className="mt-4 flex items-center gap-3" aria-label="Social media links">
            <a href="#contact" aria-label="Facebook" className="grid size-8 place-items-center rounded-full border border-border text-accent transition-colors hover:bg-accent hover:text-accent-foreground"><Facebook className="size-4" /></a>
            {contactInfo?.instagramUrl && <a href={contactInfo.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-8 place-items-center rounded-full border border-border transition-colors hover:bg-accent"><img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/instagram/default.svg" alt="" width="18" height="18" className="size-[18px] object-contain" /></a>}
            <a href="#contact" aria-label="YouTube" className="grid size-8 place-items-center rounded-full border border-border text-accent transition-colors hover:bg-accent hover:text-accent-foreground"><Youtube className="size-4" /></a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">© 2026 Lotus Wellness. All rights reserved.</p>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-guiding-pink">SERVICES</h2>
          <nav className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground" aria-label="Services navigation">
            <a href="#services" className="transition-colors hover:text-accent">Massage</a>
            <a href="#services" className="transition-colors hover:text-accent">Aroma Massage</a>
            <a href="#services" className="transition-colors hover:text-accent">Deep Tissue</a>
            <a href="#services" className="transition-colors hover:text-accent">Couple Massage</a>
            <a href="#services" className="transition-colors hover:text-accent">Foot Massage</a>
          </nav>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-guiding-pink">ABOUT</h2>
          <nav className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground" aria-label="About navigation">
            <a href="#about" className="transition-colors hover:text-accent">About Us</a>
            <a href="#about" className="transition-colors hover:text-accent">Our Space</a>
            <a href="#experts" className="transition-colors hover:text-accent">Therapists</a>
            <a href="#contact" className="transition-colors hover:text-accent">Reviews</a>
            <a href="#faq" className="transition-colors hover:text-accent">FAQ</a>
          </nav>
        </div>
        <div id="contact" className="px-2 py-2 text-foreground">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-guiding-pink">WORKING HOURS</h2>
          <div className="mt-5 flex items-start gap-4">
            <Clock3 className="mt-1 size-7 shrink-0 text-accent" strokeWidth={1.6} aria-hidden="true" />
            <div className="flex flex-col gap-4 leading-6 text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">Open daily</p>
                <p>7:00 AM – 11:00 PM</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Last booking</p>
                <p>10:00 PM</p>
              </div>
            </div>
          </div>
          <div className="mt-7 flex items-center gap-4">
            <span className="text-2xl leading-none text-guiding-pink" aria-hidden="true">♡</span>
            <p className="leading-6 text-muted-foreground">Chúng tôi luôn sẵn sàng<br />chăm sóc bạn.</p>
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
