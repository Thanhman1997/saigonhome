"use client"

import { Clock3 } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-provider"
import { getContactInfo } from "@/lib/data"

type ContactInfo = Awaited<ReturnType<typeof getContactInfo>>

export function Footer({ contactInfo }: { contactInfo: ContactInfo }) {
  void contactInfo
  const { locale } = useLanguage()
  const footerCopy = {
    en: { services: "SERVICES", about: "ABOUT", working: "WORKING HOURS", open: "Open daily", last: "Last booking", note: "We are always ready to\ncare for you.", serviceLinks: ["Massage", "Aroma Massage", "Deep Tissue", "Couple Massage", "Foot Massage"], aboutLinks: ["About Us", "Our Space", "Therapists", "Reviews", "FAQ"] },
    vi: { services: "DỊCH VỤ", about: "GIỚI THIỆU", working: "GIỜ LÀM VIỆC", open: "Mở cửa mỗi ngày", last: "Nhận đặt lịch cuối", note: "Chúng tôi luôn sẵn sàng\nchăm sóc bạn.", serviceLinks: ["Massage", "Massage Aroma", "Massage mô sâu", "Massage đôi", "Massage chân"], aboutLinks: ["Về chúng tôi", "Không gian", "Chuyên viên", "Đánh giá", "FAQ"] },
    ko: { services: "서비스", about: "소개", working: "운영 시간", open: "매일 운영", last: "마지막 예약", note: "언제나 고객님을\n돌볼 준비가 되어 있습니다.", serviceLinks: ["마사지", "아로마 마사지", "딥 티슈", "커플 마사지", "발 마사지"], aboutLinks: ["소개", "공간", "테라피스트", "후기", "FAQ"] },
  }[locale]
  return (
    <footer className="border-t border-border bg-secondary px-5 py-8 font-sans text-sm text-foreground lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-1 md:grid-cols-3 md:translate-x-[1.5cm]">
        <div>
          <h2 className="font-sans text-2xl font-extrabold uppercase tracking-[0.12em] text-guiding-pink">{footerCopy.services}</h2>
          <nav className="mt-2 flex flex-col gap-1 text-2xl font-semibold leading-9 text-muted-foreground" aria-label="Services navigation">
            {footerCopy.serviceLinks.map((label) => <a key={label} href="#services" className="transition-colors hover:text-accent">{label}</a>)}
          </nav>
        </div>
        <div>
          <h2 className="font-sans text-2xl font-extrabold uppercase tracking-[0.12em] text-guiding-pink">{footerCopy.about}</h2>
          <nav className="mt-2 flex flex-col gap-1 text-2xl font-semibold leading-9 text-muted-foreground" aria-label="About navigation">
            {footerCopy.aboutLinks.map((label, index) => <a key={label} href={["#about", "#about", "#experts", "/reviews", "#faq"][index]} className="transition-colors hover:text-accent">{label}</a>)}
          </nav>
        </div>
        <div id="contact" className="text-foreground">
          <h2 className="font-sans text-2xl font-extrabold uppercase tracking-[0.12em] text-guiding-pink">{footerCopy.working}</h2>
          <div className="mt-1 flex items-start gap-2">
            <Clock3 className="mt-1 size-6 shrink-0 text-accent" strokeWidth={1.6} aria-hidden="true" />
            <div className="flex flex-col gap-1 text-2xl font-semibold leading-9 text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">{footerCopy.open}</p>
                <p>7:00 AM – 11:00 PM</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{footerCopy.last}</p>
                <p>10:00 PM</p>
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl leading-none text-guiding-pink" aria-hidden="true">♡</span>
            <p className="text-2xl font-semibold leading-9 text-muted-foreground">{footerCopy.note.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</p>
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
