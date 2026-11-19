import type { Locale } from "@/lib/i18n/dictionary"

export type { Locale }

export function asBookingLocale(value: unknown): Locale | undefined {
  return value === "en" || value === "vi" || value === "ko" ? value : undefined
}

export const bookingManagementTitles = { en: "Manage your booking", vi: "Quản lý lịch hẹn", ko: "예약 관리" }

export const bookingEmailCopy = {
  en: { received: "Booking request received", rescheduled: "Booking time updated", cancelled: "Booking cancelled", link: "Your private booking link", manage: "Manage my booking", private: "This private link expires after 45 days. Do not share it.", time: "Vietnam time", reference: "Reference", pending: "Your request is pending confirmation.", service: "Massage" },
  vi: { received: "Đã nhận yêu cầu đặt lịch", rescheduled: "Đã cập nhật giờ hẹn", cancelled: "Đã hủy lịch hẹn", link: "Liên kết riêng để quản lý lịch hẹn", manage: "Quản lý lịch hẹn của tôi", private: "Liên kết riêng này hết hạn sau 45 ngày. Vui lòng không chia sẻ.", time: "giờ Việt Nam", reference: "Mã lịch hẹn", pending: "Yêu cầu của bạn đang chờ xác nhận.", service: "Massage" },
  ko: { received: "예약 요청이 접수되었습니다", rescheduled: "예약 시간이 변경되었습니다", cancelled: "예약이 취소되었습니다", link: "예약 관리 전용 링크", manage: "내 예약 관리", private: "이 전용 링크는 45일 후 만료됩니다. 다른 사람과 공유하지 마세요.", time: "베트남 시간", reference: "예약 번호", pending: "예약 요청은 확인 대기 중입니다.", service: "마사지" },
}
