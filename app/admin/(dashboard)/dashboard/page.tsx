import Link from "next/link"
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, MessageSquare, Star, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllEventsAdmin, getDashboardOverview } from "@/lib/admin-data"

const vietnamDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" })
const readableDateFormatter = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "numeric", month: "long", year: "numeric" })

export const metadata = { title: "Tổng quan | Admin" }

export default async function DashboardPage() {
  const now = new Date()
  const today = vietnamDateFormatter.format(now)
  const [overview, events] = await Promise.all([getDashboardOverview(today), getAllEventsAdmin()])
  const { todayBookings, pendingBookings, pendingQuestions, pendingReviews, pendingChangeRequests, todayAppointments } = overview
  const endingSoon = events.filter((event) => {
    if (!event.active || !event.endDate) return false
    const endOfPromotion = new Date(`${event.endDate}T23:59:59+07:00`)
    const remaining = endOfPromotion.getTime() - now.getTime()
    return remaining >= 0 && remaining < 7 * 86400000
  }).length

  const metrics = [
    { label: "Lịch hẹn hôm nay", value: todayBookings, detail: "Lịch đang hoạt động", href: "/admin/bookings", icon: CalendarDays },
    { label: "Chờ xác nhận", value: pendingBookings, detail: "Đặt lịch mới cần duyệt", href: "/admin/bookings", icon: Clock3 },
    { label: "Câu hỏi chưa trả lời", value: pendingQuestions, detail: "Khách đang chờ phản hồi", href: "/admin/questions", icon: MessageSquare },
    { label: "Đánh giá chờ duyệt", value: pendingReviews, detail: "Chưa hiển thị trên website", href: "/admin/reviews", icon: Star },
  ]

  const tasks = [
    { label: "Yêu cầu đổi hoặc hủy lịch", count: pendingChangeRequests, detail: "Khách đang chờ xử lý yêu cầu", href: "/admin/bookings", icon: CalendarDays },
    { label: "Lịch đặt mới cần xác nhận", count: pendingBookings, detail: "Xem và cập nhật trạng thái đặt lịch", href: "/admin/bookings", icon: Clock3 },
    { label: "Câu hỏi cần phản hồi", count: pendingQuestions, detail: "Trả lời thắc mắc của khách", href: "/admin/questions", icon: MessageSquare },
    { label: "Đánh giá cần duyệt", count: pendingReviews, detail: "Kiểm tra trước khi đăng công khai", href: "/admin/reviews", icon: Star },
    { label: "Ưu đãi sắp kết thúc", count: endingSoon, detail: "Kết thúc trong 7 ngày tới", href: "/admin/promotions", icon: Tag },
  ].filter((task) => task.count > 0)

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Lotus Wellness · Vận hành</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Tổng quan hôm nay</h1>
          <p className="text-sm capitalize text-muted-foreground">{readableDateFormatter.format(now)}</p>
        </div>
        <p className="max-w-2xl text-muted-foreground">Những lịch hẹn và việc cần ưu tiên xử lý trong ngày.</p>
      </header>

      <section aria-label="Tình hình hôm nay" className="grid gap-3 @min-[30rem]:grid-cols-2 @min-[62rem]:grid-cols-4">
        {metrics.map(({ label, value, detail, href, icon: Icon }) => (
          <Link key={label} href={href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold leading-none text-foreground">{value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <div className="grid gap-5 @min-[52rem]:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Việc cần xử lý</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Các mục đang cần bạn chú ý</p>
            </div>
            {tasks.length > 0 && <Badge variant="destructive">{tasks.reduce((total, task) => total + task.count, 0)} việc</Badge>}
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {tasks.length > 0 ? tasks.map(({ label, count, detail, href, icon: Icon }) => (
              <Link key={label} href={href} className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{label}</span>
                  <span className="block text-sm text-muted-foreground">{detail}</span>
                </span>
                <Badge variant="secondary" className="shrink-0">{count}</Badge>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            )) : (
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-5">
                <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">Không có việc gấp</p>
                  <p className="text-sm text-muted-foreground">Bạn đã xử lý hết các mục cần ưu tiên.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Lịch hẹn hôm nay</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{todayBookings} lịch đang hoạt động</p>
            </div>
            <Link href="/admin/bookings" className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
              Tất cả lịch <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border">
                {todayAppointments.map((appointment) => (
                  <li key={appointment.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <time className="w-14 shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">{appointment.time}</time>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{appointment.customerName}</span>
                      <span className="block truncate text-sm text-muted-foreground">{appointment.serviceName ?? "Dịch vụ"} · {appointment.reference}</span>
                    </span>
                    <Badge variant={appointment.status === "pending" ? "secondary" : "outline"} className="shrink-0">
                      {appointment.status === "pending" ? "Chờ xác nhận" : "Đã xác nhận"}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg bg-muted/50 px-4 py-6 text-center">
                <p className="font-medium text-foreground">Chưa có lịch hẹn hôm nay</p>
                <p className="mt-1 text-sm text-muted-foreground">Các lịch mới sẽ xuất hiện tại đây.</p>
              </div>
            )}
            {todayBookings > todayAppointments.length && <p className="mt-4 border-t border-border pt-3 text-center text-sm text-muted-foreground">Còn {todayBookings - todayAppointments.length} lịch hẹn khác</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
