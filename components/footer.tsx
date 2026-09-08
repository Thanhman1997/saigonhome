"use client"

import { useLanguage } from "@/lib/i18n/language-provider"
import { getContactInfo } from "@/lib/data"

type ContactInfo = Awaited<ReturnType<typeof getContactInfo>>

export function Footer({ contactInfo }: { contactInfo: ContactInfo }) {
  void contactInfo
  const { locale } = useLanguage()
  const footerCopy = {
    en: { services: "SERVICES", about: "ABOUT", working: "WORKING HOURS", open: "Open daily", last: "Last booking", note: "We are always ready to\ncare for you.", serviceLinks: ["Massage", "Aroma Massage", "Deep Tissue", "Couple Massage", "Foot Massage"], aboutLinks: ["About Us", "Therapists", "Reviews", "FAQ"] },
    vi: { services: "DỊCH VỤ", about: "GIỚI THIỆU", working: "GIỜ LÀM VIỆC", open: "Mở cửa mỗi ngày", last: "Nhận đặt lịch cuối", note: "Chúng tôi luôn sẵn sàng\nchăm sóc bạn.", serviceLinks: ["Massage", "Massage Aroma", "Massage mô sâu", "Massage đôi", "Massage chân"], aboutLinks: ["Về chúng tôi", "Chuyên viên", "Đánh giá", "FAQ"] },
    ko: { services: "서비스", about: "소개", working: "운영 시간", open: "매일 운영", last: "마지막 예약", note: "언제나 고객님을\n돌볼 준비가 되어 있습니다.", serviceLinks: ["마사지", "아로마 마사지", "딥 티슈", "커플 마사지", "발 마사지"], aboutLinks: ["소개", "테라피스트", "후기", "FAQ"] },
  }[locale]
  return (
    <footer className="border-t border-border/70 bg-secondary px-5 py-12 font-sans text-base text-foreground lg:px-10 lg:py-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 md:flex-row md:items-start md:gap-12 lg:gap-20">
        <div className="flex-1 text-left">
          <h2 className="font-sans text-[1.8rem] font-bold leading-tight tracking-[0.08em] text-guiding-pink">{footerCopy.about}</h2>
          <nav className="mt-3 flex flex-col items-start gap-1.5 text-left text-xl font-light leading-8 text-muted-foreground" aria-label="About navigation">
            {footerCopy.aboutLinks.map((label, index) => <a key={label} href={["#about", "#experts", "/reviews", "#faq"][index]} className="transition-colors hover:text-accent">{label}</a>)}
          </nav>
        </div>
        <div className="flex-1 text-left">
          <h2 className="font-sans text-[1.8rem] font-bold leading-tight tracking-[0.08em] text-guiding-pink">{footerCopy.services}</h2>
          <nav className="mt-3 flex flex-col items-start gap-1.5 text-left text-xl font-light leading-8 text-muted-foreground" aria-label="Services navigation">
            {footerCopy.serviceLinks.map((label) => <a key={label} href="#services" className="transition-colors hover:text-accent">{label}</a>)}
          </nav>
        </div>
        <div className="flex-1 text-left text-foreground">
          <h2 className="font-sans text-[1.8rem] font-bold leading-tight tracking-[0.08em] text-guiding-pink">{footerCopy.working}</h2>
          <div className="mt-3 flex items-start">
            <div className="flex flex-col gap-1 text-left text-xl font-light leading-8 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">{footerCopy.open}</p>
                <p>7:00 AM – 11:00 PM</p>
              </div>
              <div>
                <p className="font-medium text-foreground">{footerCopy.last}</p>
                <p>10:00 PM</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start">
            <p className="text-left text-xl font-light leading-8 text-muted-foreground">{footerCopy.note.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</p>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-3 border-t border-border/70 pt-6 text-base text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Lotus Wellness Massage · Professional care delivered to you</p>
        <div className="flex gap-5"><a href="/privacy" className="transition-colors hover:text-accent">Privacy Policy</a><a href="/terms" className="transition-colors hover:text-accent">Terms of Service</a></div>
      </div>
    </footer>
  )
}
