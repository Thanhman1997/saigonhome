import type { Locale } from "@/lib/i18n/dictionary"

export type { Locale }

export function asBookingLocale(value: unknown): Locale | undefined {
  return value === "en" || value === "vi" || value === "ko" ? value : undefined
}

const checkoutErrors: Record<string, [string, string]> = {
  "Name is required": ["Vui lòng nhập họ tên.", "이름을 입력해 주세요."],
  "Invalid email": ["Vui lòng nhập email hợp lệ.", "올바른 이메일 주소를 입력해 주세요."],
  "Phone is required": ["Vui lòng nhập số điện thoại hợp lệ.", "올바른 전화번호를 입력해 주세요."],
  "Address is required": ["Vui lòng nhập địa chỉ.", "주소를 입력해 주세요."],
  "Date and time are required": ["Vui lòng chọn ngày và giờ.", "날짜와 시간을 선택해 주세요."],
  "Invalid date or time": ["Ngày hoặc giờ không hợp lệ.", "날짜 또는 시간이 올바르지 않습니다."],
  "Selected date is outside the booking window": ["Ngày đã chọn nằm ngoài thời hạn đặt lịch.", "선택한 날짜는 예약 가능 기간을 벗어났습니다."],
  "Selected day is unavailable": ["Ngày đã chọn không còn trống.", "선택한 날짜에는 예약할 수 없습니다."],
  "Selected time is unavailable": ["Giờ đã chọn không còn trống.", "선택한 시간에는 예약할 수 없습니다."],
  "Selected service is unavailable": ["Dịch vụ đã chọn hiện không khả dụng.", "선택한 서비스는 현재 이용할 수 없습니다."],
  "Selected duration is unavailable for this service": ["Thời lượng đã chọn không áp dụng cho dịch vụ này.", "이 서비스에는 선택한 소요 시간을 적용할 수 없습니다."],
  "Selected therapist is unavailable": ["Kỹ thuật viên đã chọn hiện không khả dụng.", "선택한 테라피스트는 현재 예약할 수 없습니다."],
  "Please wait before trying again.": ["Vui lòng đợi trước khi thử lại.", "잠시 후 다시 시도해 주세요."],
  "Something went wrong. Please try again.": ["Đã xảy ra lỗi. Vui lòng thử lại.", "오류가 발생했습니다. 다시 시도해 주세요."],
}

export function localizeBookingError(error: string, locale: Locale) {
  if (locale === "en") return error
  const max = /^Invalid number of guests \(max (\d+)\)$/.exec(error)?.[1]
  if (max) return locale === "vi" ? `Số khách không hợp lệ (tối đa ${max}).` : `인원수가 올바르지 않습니다(최대 ${max}명).`
  return (checkoutErrors[error] ?? checkoutErrors["Something went wrong. Please try again."])[locale === "vi" ? 0 : 1]
}

export function localizedServiceName(service: { nameEn: string; nameVi: string; nameKo: string } | null | undefined, locale: Locale) {
  return service ? { en: service.nameEn, vi: service.nameVi, ko: service.nameKo }[locale] || null : null
}

const formats = { en: "en-US", vi: "vi-VN", ko: "ko-KR" }

export const bookingStatusLabels = {
  en: { pending: "Pending confirmation", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled", rejected: "Rejected" },
  vi: { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", completed: "Đã hoàn thành", cancelled: "Đã hủy", rejected: "Bị từ chối" },
  ko: { pending: "확인 대기 중", confirmed: "예약 확정", completed: "이용 완료", cancelled: "예약 취소", rejected: "예약 거절" },
}

export function formatBookingDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(formats[locale], { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))
}

export function formatBookingTime(time: string, locale: Locale) {
  if (time === "24:00" && locale === "vi") return time
  const normalized = time === "24:00" ? "00:00" : time
  return new Intl.DateTimeFormat(formats[locale], { timeStyle: "short", timeZone: "UTC" }).format(new Date(`2000-01-01T${normalized}:00Z`))
}

export const bookingManagementTitles = { en: "Manage your booking", vi: "Quản lý lịch hẹn", ko: "예약 관리" }

export const bookingEmailCopy = {
  en: { received: "Booking request received", rescheduled: "Booking time updated", cancelled: "Booking cancelled", rejected: "Booking request declined", link: "Your private booking link", manage: "Manage my booking", private: "This private link expires after 45 days. Do not share it.", time: "Vietnam time", reference: "Reference", pending: "Your request is pending confirmation.", service: "Massage" },
  vi: { received: "Đã nhận yêu cầu đặt lịch", rescheduled: "Đã cập nhật giờ hẹn", cancelled: "Đã hủy lịch hẹn", rejected: "Yêu cầu đặt lịch đã bị từ chối", link: "Liên kết riêng để quản lý lịch hẹn", manage: "Quản lý lịch hẹn của tôi", private: "Liên kết riêng này hết hạn sau 45 ngày. Vui lòng không chia sẻ.", time: "giờ Việt Nam", reference: "Mã lịch hẹn", pending: "Yêu cầu của bạn đang chờ xác nhận.", service: "Massage" },
  ko: { received: "예약 요청이 접수되었습니다", rescheduled: "예약 시간이 변경되었습니다", cancelled: "예약이 취소되었습니다", rejected: "예약 요청이 거절되었습니다", link: "예약 관리 전용 링크", manage: "내 예약 관리", private: "이 전용 링크는 45일 후 만료됩니다. 다른 사람과 공유하지 마세요.", time: "베트남 시간", reference: "예약 번호", pending: "예약 요청은 확인 대기 중입니다.", service: "마사지" },
}
