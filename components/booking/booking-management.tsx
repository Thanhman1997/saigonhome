"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, CalendarDays, LockKeyhole } from "lucide-react"
import Link from "next/link"
import { changeManagedBooking, readManagedBooking, readManagedBookingSlots } from "@/app/actions/booking-management"
import { pickLocalized, useLanguage } from "@/lib/i18n/language-provider"

const copy = {
  en: { title: "Manage your booking", back: "Back to booking", loading: "Opening your appointment…", locked: "Open the private link in your booking email. If your link has expired or you can’t find it, contact Lotus Wellness.", contact: "Contact Lotus Wellness", service: "Massage", date: "Appointment (Vietnam time)", guests: "Guests", duration: "Duration (minutes)", total: "Total", reschedule: "Change time", cancel: "Cancel booking", chooseDate: "Choose a new date", times: "Available times (Vietnam time)", select: "Select a time", empty: "No available times on this date. Try another date.", save: "Confirm new time", confirm: "Confirm cancellation", keep: "Keep my booking", blocked: "Contact Lotus Wellness for changes to this booking.", payment: "If you’ve paid or started online payment, contact Lotus Wellness to cancel and check refund eligibility.", cancelNotice: "This will cancel your appointment. If you paid separately, contact Lotus Wellness about a possible refund.", changed: "Your booking time has been updated.", cancelled: "Your booking has been cancelled.", mailFailed: "We couldn’t send the update email.", failed: "We couldn’t complete your request. Please try again.", taken: "That time is no longer available. Choose another time.", slotsFailed: "We couldn’t load available times.", retry: "Try again", statuses: { pending: "Pending confirmation", confirmed: "Confirmed", cancelled: "Cancelled", completed: "Completed" } },
  vi: { title: "Quản lý lịch hẹn", back: "Về trang đặt lịch", loading: "Đang mở lịch hẹn…", locked: "Hãy mở liên kết riêng trong email đặt lịch. Nếu liên kết hết hạn hoặc bạn không tìm thấy email, hãy liên hệ Lotus Wellness.", contact: "Liên hệ Lotus Wellness", service: "Massage", date: "Lịch hẹn (giờ Việt Nam)", guests: "Số khách", duration: "Thời lượng (phút)", total: "Tổng tiền", reschedule: "Đổi giờ", cancel: "Hủy lịch", chooseDate: "Chọn ngày mới", times: "Khung giờ còn trống (giờ Việt Nam)", select: "Chọn giờ", empty: "Ngày này không còn giờ trống. Vui lòng chọn ngày khác.", save: "Xác nhận giờ mới", confirm: "Xác nhận hủy lịch", keep: "Giữ lịch hẹn", blocked: "Vui lòng liên hệ Lotus Wellness nếu cần thay đổi lịch này.", payment: "Nếu đã thanh toán hoặc bắt đầu thanh toán online, vui lòng liên hệ Lotus Wellness để hủy và kiểm tra điều kiện hoàn tiền.", cancelNotice: "Thao tác này sẽ hủy lịch hẹn. Nếu đã thanh toán bằng cách khác, vui lòng liên hệ Lotus Wellness để kiểm tra việc hoàn tiền.", changed: "Đã cập nhật giờ hẹn của bạn.", cancelled: "Đã hủy lịch hẹn của bạn.", mailFailed: "Chưa gửi được email thông báo.", failed: "Không thể xử lý yêu cầu. Vui lòng thử lại.", taken: "Giờ này không còn trống. Vui lòng chọn giờ khác.", slotsFailed: "Không tải được các giờ còn trống.", retry: "Thử lại", statuses: { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", cancelled: "Đã hủy", completed: "Đã hoàn thành" } },
  ko: { title: "예약 관리", back: "예약 페이지로 돌아가기", loading: "예약을 불러오는 중…", locked: "예약 이메일의 전용 링크를 여세요. 링크가 만료되었거나 이메일을 찾을 수 없다면 Lotus Wellness에 문의하세요.", contact: "Lotus Wellness에 문의", service: "마사지", date: "예약 일시 (베트남 시간)", guests: "인원", duration: "소요 시간 (분)", total: "총 금액", reschedule: "시간 변경", cancel: "예약 취소", chooseDate: "새 날짜 선택", times: "예약 가능한 시간 (베트남 시간)", select: "시간 선택", empty: "이 날짜에 가능한 시간이 없습니다. 다른 날짜를 선택하세요.", save: "새 시간 확정", confirm: "취소 확정", keep: "예약 유지", blocked: "이 예약을 변경하려면 Lotus Wellness에 문의하세요.", payment: "결제를 완료했거나 온라인 결제를 시작한 경우 취소 및 환불 가능 여부는 Lotus Wellness에 문의하세요.", cancelNotice: "예약이 취소됩니다. 별도로 결제하신 경우 환불 가능 여부는 Lotus Wellness에 문의하세요.", changed: "예약 시간이 변경되었습니다.", cancelled: "예약이 취소되었습니다.", mailFailed: "변경 안내 이메일을 보내지 못했습니다.", failed: "요청을 처리하지 못했습니다. 다시 시도해 주세요.", taken: "선택한 시간은 사용할 수 없습니다. 다른 시간을 선택하세요.", slotsFailed: "가능한 시간을 불러오지 못했습니다.", retry: "다시 시도", statuses: { pending: "확인 대기", confirmed: "예약 확정", cancelled: "예약 취소", completed: "서비스 완료" } },
}

type Booking = Extract<Awaited<ReturnType<typeof readManagedBooking>>, { ok: true }>["booking"]
type Screen = "loading" | "locked" | "failed" | "ready"
const baseButton = "inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-50"
const primaryButton = `${baseButton} border-primary bg-primary text-primary-foreground`
const secondaryButton = `${baseButton} border-border bg-background text-foreground`
const fieldClass = "min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-foreground"

export function BookingManagement() {
  const { locale } = useLanguage()
  const t = copy[locale]
  const access = useRef("")
  const slotRequest = useRef(0)
  const [screen, setScreen] = useState<Screen>("loading")
  const [booking, setBooking] = useState<Booking>()
  const [mode, setMode] = useState<"reschedule" | "cancel" | null>(null)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [times, setTimes] = useState<string[] | null>(null)
  const [slotState, setSlotState] = useState<"idle" | "loading" | "error">("idle")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<"taken" | "blocked" | "failed" | null>(null)
  const [success, setSuccess] = useState<{ type: "changed" | "cancelled"; emailed: boolean } | null>(null)

  useEffect(() => {
    let revision = 0
    async function openLink() {
      const current = ++revision
      const hash = window.location.hash
      if (hash) {
        access.current = new URLSearchParams(hash.slice(1)).get("access") ?? ""
        window.history.replaceState(window.history.state, "", window.location.pathname)
      }
      await Promise.resolve()
      if (current !== revision) return
      if (!access.current) { setScreen("locked"); return }
      ++slotRequest.current
      setScreen("loading")
      setMode(null)
      setDate("")
      setTime("")
      setTimes(null)
      setSlotState("idle")
      setBusy(false)
      setSuccess(null)
      setMessage(null)
      try {
        const result = await readManagedBooking(access.current)
        if (current !== revision) return
        if (!result.ok) { setScreen("locked"); return }
        setBooking(result.booking)
        setScreen("ready")
      } catch {
        if (current === revision) setScreen("failed")
      }
    }
    void openLink()
    window.addEventListener("hashchange", openLink)
    return () => {
      ++revision
      window.removeEventListener("hashchange", openLink)
    }
  }, [])

  async function loadTimes(nextDate: string) {
    const request = ++slotRequest.current
    setDate(nextDate)
    setTime("")
    setTimes(null)
    setMessage(null)
    setSlotState(nextDate ? "loading" : "idle")
    if (!nextDate) return
    try {
      const result = await readManagedBookingSlots(access.current, nextDate)
      if (request !== slotRequest.current) return
      if (result.ok) { setTimes(result.times); setSlotState("idle") }
      else if (result.error === "invalid") setScreen("locked")
      else { setMessage("blocked"); setSlotState("idle") }
    } catch {
      if (request === slotRequest.current) setSlotState("error")
    }
  }

  function selectMode(nextMode: typeof mode) {
    ++slotRequest.current
    setMode(nextMode)
    setDate("")
    setTime("")
    setTimes(null)
    setSlotState("idle")
    setMessage(null)
    setSuccess(null)
  }

  async function submit() {
    if (busy || !mode || (mode === "reschedule" && (!date || !time))) return
    const token = access.current
    setBusy(true)
    setMessage(null)
    try {
      const result = await changeManagedBooking(token, mode === "cancel" ? { kind: "cancel" } : { kind: "reschedule", date, time })
      if (token !== access.current) return
      if (result.ok) {
        setBooking(result.booking)
        selectMode(null)
        setSuccess({ type: mode === "cancel" ? "cancelled" : "changed", emailed: result.emailed })
      } else if (result.error === "invalid") setScreen("locked")
      else if (result.error === "unavailable") {
        await loadTimes(date)
        if (token === access.current) setMessage("taken")
      } else setMessage("blocked")
    } catch {
      if (token === access.current) setMessage("failed")
    } finally {
      if (token === access.current) setBusy(false)
    }
  }

  const contact = <Link href="/#contact" className="inline-flex min-h-11 items-center font-semibold text-foreground underline underline-offset-4">{t.contact}</Link>
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:py-16">
      <div className="mx-auto max-w-2xl">
        <a href="/booking" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={16} aria-hidden="true" />{t.back}</a>
        <section className="mt-4 rounded-2xl border border-border bg-card p-6 text-card-foreground sm:p-8">
          <div className="flex items-center justify-between gap-4"><CalendarDays className="text-primary" aria-hidden="true" /><LockKeyhole size={18} className="text-muted-foreground" aria-hidden="true" /></div>
          <h1 className="mt-4 text-balance font-serif text-4xl! font-semibold">{t.title}</h1>
          {screen === "loading" && <p role="status" className="mt-4 text-muted-foreground">{t.loading}</p>}
          {(screen === "locked" || screen === "failed") && <><p role="status" className="mt-4 leading-relaxed text-muted-foreground">{screen === "locked" ? t.locked : t.failed}</p>{contact}</>}
          {screen === "ready" && booking && (
            <>
              <div className="mt-6 rounded-xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-serif text-2xl font-semibold">{booking.service ? pickLocalized(booking.service, locale) : t.service}</h2><span className="font-mono text-sm text-muted-foreground">#{booking.reference}</span></div>
                <p className="mt-1 font-semibold text-primary">{t.statuses[booking.status as keyof typeof t.statuses] ?? booking.status}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><dt className="text-muted-foreground">{t.date}</dt><dd>{booking.date} · {booking.time}</dd></div>
                  <div><dt className="text-muted-foreground">{t.guests}</dt><dd>{booking.guests}</dd></div>
                  <div><dt className="text-muted-foreground">{t.duration}</dt><dd>{booking.duration}</dd></div>
                  <div><dt className="text-muted-foreground">{t.total}</dt><dd>{new Intl.NumberFormat(locale, { style: "currency", currency: "VND" }).format(booking.total)}</dd></div>
                </dl>
              </div>
              {success && <p role="status" className="mt-4 font-semibold text-primary">{t[success.type]} {!success.emailed && t.mailFailed}</p>}
              {message && <p role="alert" className="mt-4 text-destructive">{t[message]}</p>}
              {!mode && booking.canChange && (
                <div className="mt-6 flex flex-wrap gap-3"><button type="button" className={primaryButton} onClick={() => selectMode("reschedule")}>{t.reschedule}</button>{booking.canCancel && <button type="button" className={secondaryButton} onClick={() => selectMode("cancel")}>{t.cancel}</button>}</div>
              )}
              {!mode && booking.canChange && !booking.canCancel && <><p className="mt-4 text-muted-foreground">{t.payment}</p>{contact}</>}
              {!mode && !booking.canChange && !["cancelled", "completed"].includes(booking.status) && <><p className="mt-4 text-muted-foreground">{t.blocked}</p>{contact}</>}
              {mode && (
                <form onSubmit={(event) => { event.preventDefault(); void submit() }} className="mt-6 border-t border-border pt-5">
                  <h2 className="font-serif text-2xl font-semibold">{mode === "cancel" ? t.cancel : t.reschedule}</h2>
                  {mode === "cancel" ? <p className="mt-2 text-muted-foreground">{t.cancelNotice}</p> : (
                    <div className="mt-3 flex flex-col gap-3 sm:max-w-sm">
                      <label className="flex flex-col gap-1">{t.chooseDate}<input className={fieldClass} type="date" min={booking.dates.min} max={booking.dates.max} value={date} onChange={(event) => void loadTimes(event.target.value)} required disabled={busy} /></label>
                      {slotState === "loading" && <p role="status">{t.loading}</p>}
                      {slotState === "error" && <p role="alert">{t.slotsFailed} <button type="button" onClick={() => void loadTimes(date)} className="underline">{t.retry}</button></p>}
                      {times?.length === 0 && <p role="status" className="text-muted-foreground">{t.empty}</p>}
                      {!!times?.length && <label className="flex flex-col gap-1">{t.times}<select className={fieldClass} value={time} onChange={(event) => setTime(event.target.value)} required disabled={busy}><option value="">{t.select}</option>{times.map((available) => <option key={available}>{available}</option>)}</select></label>}
                    </div>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3"><button type="submit" className={primaryButton} disabled={busy || (mode === "reschedule" && !time)}>{mode === "cancel" ? t.confirm : t.save}</button><button type="button" className={secondaryButton} disabled={busy} onClick={() => selectMode(null)}>{t.keep}</button></div>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  )
}
