"use client"

import { ArrowDown, LockKeyhole, Mail } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-provider"

const copy = {
  en: { title: "Book your massage", intro: "Explore our treatments, see prices and durations, and choose an appointment at your home or hotel.", services: "Explore services", manage: "Manage my booking", instruction: "Open the private link in your booking email to change the time or cancel. No account is needed.", missing: "Can’t find your email?", contact: "Contact Lotus Wellness" },
  vi: { title: "Đặt lịch massage", intro: "Xem đầy đủ dịch vụ, thời lượng và giá, rồi chọn lịch massage tại nhà hoặc khách sạn.", services: "Xem các dịch vụ", manage: "Quản lý lịch hẹn", instruction: "Để đổi giờ hoặc hủy lịch, hãy mở liên kết riêng trong email đặt lịch. Bạn không cần đăng nhập.", missing: "Không tìm thấy email?", contact: "Liên hệ Lotus Wellness" },
  ko: { title: "마사지 예약", intro: "서비스별 가격과 소요 시간을 확인하고 자택이나 호텔에서 받을 마사지를 예약하세요.", services: "서비스 둘러보기", manage: "내 예약 관리", instruction: "시간을 변경하거나 취소하려면 예약 이메일의 전용 링크를 여세요. 로그인은 필요하지 않습니다.", missing: "이메일을 찾을 수 없으신가요?", contact: "Lotus Wellness에 문의" },
}

export function BookingLanding() {
  const { locale } = useLanguage()
  const text = copy[locale]

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 py-10 md:flex-row md:items-center md:justify-between lg:px-20 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-widest text-primary">LOTUS WELLNESS / BOOKING</p>
          <h1 className="mt-3 text-balance font-serif text-5xl! font-semibold text-foreground sm:text-6xl! lg:text-7xl!">{text.title}</h1>
          <p className="mt-4 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">{text.intro}</p>
          <a href="#services" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{text.services}<ArrowDown size={16} aria-hidden="true" /></a>
        </div>
        <aside id="manage" aria-labelledby="manage-title" className="w-full scroll-mt-28 rounded-2xl border border-border bg-card p-6 text-card-foreground md:max-w-sm">
          <div className="flex items-center justify-between"><Mail size={24} aria-hidden="true" className="text-primary" /><LockKeyhole size={18} aria-hidden="true" className="text-muted-foreground" /></div>
          <h2 id="manage-title" className="mt-3 font-serif text-3xl! font-semibold">{text.manage}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{text.instruction}</p>
          <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">{text.missing} <Link href="/#contact" className="font-semibold text-foreground underline underline-offset-4">{text.contact}</Link></p>
        </aside>
      </div>
    </section>
  )
}
