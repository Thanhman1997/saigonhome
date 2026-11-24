"use client"

import { useLanguage } from "@/lib/i18n/language-provider"
import { getContactInfo } from "@/lib/data"

type ContactInfo = Awaited<ReturnType<typeof getContactInfo>>

export function Footer({ contactInfo }: { contactInfo: ContactInfo }) {
  void contactInfo
  const { locale } = useLanguage()
  const footerCopy = {
    en: {
      services: "SERVICES",
      about: "ABOUT",
      working: "WORKING HOURS",
      open: "Open daily",
      openHours: "9:00 AM – 12:00 AM",
      last: "Latest booking time",
      lastHours: "Varies by treatment duration",
      note: "We are always ready to\ncare for you.",
      serviceLinks: ["Thai Massage", "Aroma Massage", "Vietnamese Massage", "Full Body Massage", "Recovery Massage"],
      aboutLinks: ["About Us", "Therapists", "Reviews", "FAQ"],
    },
    vi: {
      services: "DỊCH VỤ",
      about: "GIỚI THIỆU",
      working: "GIỜ LÀM VIỆC",
      open: "Mở cửa mỗi ngày",
      openHours: "09:00 – 00:00",
      last: "Lịch hẹn cuối",
      lastHours: "Tùy thời lượng dịch vụ",
      note: "Chúng tôi luôn sẵn sàng\nchăm sóc bạn.",
      serviceLinks: ["Massage Thái", "Massage tinh dầu", "Massage Việt Nam", "Massage toàn thân", "Massage phục hồi"],
      aboutLinks: ["Về chúng tôi", "Chuyên viên", "Đánh giá", "FAQ"],
    },
    ko: {
      services: "서비스",
      about: "소개",
      working: "운영 시간",
      open: "매일 운영",
      openHours: "오전 9:00 – 오전 12:00",
      last: "마지막 예약 시간",
      lastHours: "서비스 시간에 따라 다릅니다",
      note: "언제나 고객님을\n돌볼 준비가 되어 있습니다.",
      serviceLinks: ["타이 마사지", "아로마 마사지", "베트남 마사지", "전신 마사지", "회복 마사지"],
      aboutLinks: ["브랜드 소개", "테라피스트", "후기", "FAQ"],
    },
  }[locale]

  return (
    <footer className="border-t border-border/70 bg-secondary px-5 py-10 font-sans text-base text-foreground sm:px-8 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16">
        <div className="min-w-0 text-left">
          <h2 className="font-sans text-sm font-semibold leading-5 tracking-[0.08em] text-guiding-pink">{footerCopy.about}</h2>
          <nav className="mt-4 flex flex-col items-start gap-1.5 text-left text-base font-light leading-7 text-muted-foreground" aria-label="About navigation">
            {footerCopy.aboutLinks.map((label, index) => <a key={label} href={["#about", "#experts", "/reviews", "#faq"][index]} className="transition-colors hover:text-accent">{label}</a>)}
          </nav>
        </div>
        <div className="min-w-0 text-left">
          <h2 className="font-sans text-sm font-semibold leading-5 tracking-[0.08em] text-guiding-pink">{footerCopy.services}</h2>
          <nav className="mt-4 flex flex-col items-start gap-1.5 text-left text-base font-light leading-7 text-muted-foreground" aria-label="Services navigation">
            {footerCopy.serviceLinks.map((label) => <a key={label} href="#services" className="transition-colors hover:text-accent">{label}</a>)}
          </nav>
        </div>
        <div className="min-w-0 text-left text-foreground">
          <h2 className="font-sans text-sm font-semibold leading-5 tracking-[0.08em] text-guiding-pink">{footerCopy.working}</h2>
          <div className="mt-4 flex flex-col gap-4 text-left text-base font-light leading-6 text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">{footerCopy.open}</p>
              <p>{footerCopy.openHours}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">{footerCopy.last}</p>
              <p>{footerCopy.lastHours}</p>
            </div>
          </div>
          <p className="mt-4 text-left text-base font-light leading-6 text-muted-foreground">{footerCopy.note.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</p>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-4 border-t border-border/70 pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:pr-40">
        <p>Lotus Wellness Massage · Professional care delivered to you</p>
        <div className="flex gap-5"><a href="/privacy" className="transition-colors hover:text-accent">Privacy Policy</a><a href="/terms" className="transition-colors hover:text-accent">Terms of Service</a></div>
      </div>
    </footer>
  )
}
