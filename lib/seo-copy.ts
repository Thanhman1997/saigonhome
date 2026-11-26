type Localized = { en: string; vi: string; ko: string }

/**
 * Keyword map (one primary intent per page, no overlap):
 * - Home        brand + "mobile massage Ho Chi Minh City" / "massage tại nhà TPHCM" / "호치민 출장 마사지"
 * - Services    treatments + prices ("massage services and prices")
 * - Service     the treatment name + hotel/home delivery
 * - Booking     "book a massage" intent
 * - Reviews     "reviews" intent
 */
export const seoCopy = {
  home: {
    title: {
      en: "Lotus Wellness | Mobile Massage in Ho Chi Minh City",
      vi: "Lotus Wellness | Massage tại nhà & khách sạn TPHCM",
      ko: "Lotus Wellness | 호치민 출장 마사지 · 호텔 방문 서비스",
    },
    description: {
      en: "Book a professional massage at your hotel, apartment or home in Ho Chi Minh City. Vetted therapists, clear prices, and booking support in English, Korean and Vietnamese.",
      vi: "Đặt massage chuyên nghiệp tại khách sạn, căn hộ hoặc nhà riêng ở TPHCM. Kỹ thuật viên được tuyển chọn, giá rõ ràng, hỗ trợ đặt lịch bằng tiếng Việt, Anh và Hàn.",
      ko: "호치민 호텔·아파트·자택으로 찾아가는 전문 출장 마사지. 검증된 테라피스트, 투명한 가격, 한국어·영어·베트남어 예약 지원.",
    },
  },
  services: {
    title: {
      en: "Massage Services & Prices in Ho Chi Minh City",
      vi: "Dịch vụ massage tại nhà & bảng giá ở TPHCM",
      ko: "호치민 출장 마사지 서비스 및 가격",
    },
    description: {
      en: "Compare our mobile massage treatments, session lengths and prices in VND. Every treatment is delivered to your hotel, apartment or home in Ho Chi Minh City.",
      vi: "So sánh các liệu trình massage tại nhà, thời lượng và giá (VND). Mọi liệu trình đều được thực hiện tại khách sạn, căn hộ hoặc nhà riêng của bạn ở TPHCM.",
      ko: "출장 마사지 프로그램, 시간별 요금(VND)을 비교해 보세요. 호치민의 호텔·아파트·자택으로 직접 찾아갑니다.",
    },
  },
  booking: {
    title: {
      en: "Book a Mobile Massage in Ho Chi Minh City",
      vi: "Đặt lịch massage tại nhà ở TPHCM",
      ko: "호치민 출장 마사지 예약",
    },
    description: {
      en: "Choose a treatment, pick a time and book a therapist to come to your hotel or home in Ho Chi Minh City. Already booked? Find out how to manage your appointment.",
      vi: "Chọn liệu trình, thời gian và kỹ thuật viên đến tận khách sạn hoặc nhà bạn ở TPHCM. Đã đặt lịch? Xem cách quản lý lịch hẹn của bạn.",
      ko: "프로그램과 시간을 선택하고 호치민의 호텔·자택으로 방문할 테라피스트를 예약하세요. 이미 예약하셨다면 예약 관리 방법도 확인하세요.",
    },
  },
  reviews: {
    title: {
      en: "Guest Reviews of Our Mobile Massage",
      vi: "Đánh giá của khách hàng về dịch vụ massage tại nhà",
      ko: "출장 마사지 고객 후기",
    },
    description: {
      en: "Read guest experiences from Lotus Wellness mobile massage visits in Ho Chi Minh City.",
      vi: "Đọc trải nghiệm của khách hàng sau các buổi massage tại nhà của Lotus Wellness ở TPHCM.",
      ko: "호치민에서 Lotus Wellness 출장 마사지를 이용하신 고객님들의 후기를 확인하세요.",
    },
  },
  privacy: {
    title: "Privacy Policy",
    description: "How Lotus Wellness handles booking and enquiry information.",
  },
  terms: {
    title: "Terms of Service",
    description: "Terms for booking Lotus Wellness mobile massage services.",
  },
} satisfies Record<string, { title: Localized | string; description: Localized | string }>

export const serviceCopy = {
  title: (name: string): Localized => ({
    en: `${name} – Mobile Massage in Ho Chi Minh City`,
    vi: `${name} tại nhà & khách sạn ở TPHCM`,
    ko: `${name} – 호치민 출장 마사지`,
  }),
  descriptionSuffix: {
    en: "Book it at your hotel, apartment or home in Ho Chi Minh City.",
    vi: "Đặt lịch tại khách sạn, căn hộ hoặc nhà bạn ở TPHCM.",
    ko: "호치민의 호텔·아파트·자택으로 방문 예약하세요.",
  } satisfies Localized,
}
