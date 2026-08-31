import Link from "next/link"
import { AlertTriangle, ArrowUpRight, CalendarDays, ClipboardList, FileText, MessageSquare, Star, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllBookingsWithRelations, getAllEventsAdmin, getAllFaqsAdmin, getAllQuestions, getAllReviewsWithRelations, getAllServicesAdmin, getAboutContentAdmin, getHeroContentAdmin } from "@/lib/admin-data"

export const metadata = { title: "Dashboard | Admin" }

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1))
  result.setHours(0, 0, 0, 0)
  return result
}

export default async function DashboardPage() {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const weekStart = startOfWeek(now)
  const [bookings, questions, reviews, events, services, faqs, hero, about] = await Promise.all([
    getAllBookingsWithRelations(), getAllQuestions(), getAllReviewsWithRelations(), getAllEventsAdmin(), getAllServicesAdmin(), getAllFaqsAdmin(), getHeroContentAdmin(), getAboutContentAdmin(),
  ])
  const todayBookings = bookings.filter((booking) => booking.date === today).length
  const weekBookings = bookings.filter((booking) => new Date(booking.createdAt) >= weekStart).length
  const unreadQuestions = questions.filter((question) => question.status === "pending").length
  const pendingReviews = reviews.filter((review) => !review.approved).length
  const activePromotions = events.filter((event) => event.active).length
  const endingSoon = events.filter((event) => event.active && event.endDate && new Date(`${event.endDate}T23:59:59`) >= now && new Date(`${event.endDate}T23:59:59`).getTime() - now.getTime() < 7 * 86400000).length
  const missingTranslations = services.filter((s) => !s.nameEn || !s.nameKo || !s.nameVi || !s.descEn || !s.descKo || !s.descVi).length + faqs.filter((f) => !f.questionEn || !f.questionKo || !f.questionVi || !f.answerEn || !f.answerKo || !f.answerVi).length + (hero && (!hero.kickerEn || !hero.kickerKo || !hero.kickerVi || !hero.titleLine1En || !hero.titleLine1Ko || !hero.titleLine1Vi || !hero.titleLine2En || !hero.titleLine2Ko || !hero.titleLine2Vi || !hero.subtitleEn || !hero.subtitleKo || !hero.subtitleVi || !hero.ctaEn || !hero.ctaKo || !hero.ctaVi) ? 1 : 0) + (about && (!about.titleEn || !about.titleKo || !about.titleVi) ? 1 : 0)
  const stats = [
    { label: "Bookings today", value: todayBookings, detail: `${weekBookings} this week`, href: "/admin/bookings", icon: CalendarDays },
    { label: "Unread questions", value: unreadQuestions, detail: "Needs a reply", href: "/admin/questions", icon: MessageSquare },
    { label: "Pending reviews", value: pendingReviews, detail: "Awaiting approval", href: "/admin/reviews", icon: Star },
    { label: "Missing translations", value: missingTranslations, detail: "KR / VN / EN", href: "/admin/pages", icon: FileText },
    { label: "Active promotions", value: activePromotions, detail: `${endingSoon} ending soon`, href: "/admin/promotions", icon: Tag },
  ]
  const alerts = [
    unreadQuestions > 0 && { text: `${unreadQuestions} questions chưa trả lời`, href: "/admin/questions" },
    pendingReviews > 0 && { text: `${pendingReviews} reviews chưa xử lý`, href: "/admin/reviews" },
    endingSoon > 0 && { text: `${endingSoon} promotion sắp hết hạn`, href: "/admin/promotions" },
    missingTranslations > 0 && { text: `${missingTranslations} nội dung thiếu bản dịch`, href: "/admin/pages" },
  ].filter(Boolean) as { text: string; href: string }[]

  return <div className="flex flex-col gap-8">
    <div className="flex flex-col gap-2"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Content studio</p><h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">Dashboard</h1><p className="max-w-2xl text-muted-foreground">Theo dõi hoạt động và xử lý những việc cần làm trên website.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{stats.map(({ label, value, detail, href, icon: Icon }) => <Link key={label} href={href}><Card className="h-full transition-colors hover:border-primary/50"><CardHeader className="flex flex-row items-center justify-between gap-3 pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle><Icon className="size-4 text-primary" aria-hidden="true" /></CardHeader><CardContent><p className="text-3xl font-semibold text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card></Link>)}</div>
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"><Card><CardHeader><CardTitle>Notifications / Tasks</CardTitle></CardHeader><CardContent className="flex flex-col gap-2">{alerts.length ? alerts.map((alert) => <Link key={alert.href} href={alert.href} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"><span className="flex items-center gap-3"><AlertTriangle className="size-4 text-primary" aria-hidden="true" />{alert.text}</span><ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" /></Link>) : <p className="text-sm text-muted-foreground">Không có việc cần xử lý ngay.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Website status</CardTitle></CardHeader><CardContent className="flex flex-col gap-3 text-sm"><Link href="/admin/services" className="flex items-center justify-between hover:text-primary"><span>Services</span><Badge variant="secondary">{services.length}</Badge></Link><Link href="/admin/faq" className="flex items-center justify-between hover:text-primary"><span>FAQ entries</span><Badge variant="secondary">{faqs.length}</Badge></Link><Link href="/admin/promotions" className="flex items-center justify-between hover:text-primary"><span>Active promotions</span><Badge variant="secondary">{activePromotions}</Badge></Link><Link href="/admin/pages" className="flex items-center justify-between hover:text-primary"><span>Draft / translation review</span><Badge variant={missingTranslations ? "destructive" : "secondary"}>{missingTranslations}</Badge></Link></CardContent></Card></div>
    <Card><CardHeader><CardTitle>Translation coverage</CardTitle></CardHeader><CardContent className="overflow-x-auto"><div className="min-w-[520px] text-sm"><div className="grid grid-cols-[1fr_repeat(3,72px)] gap-3 border-b border-border pb-3 font-semibold"><span>Content</span><span className="text-center">KR</span><span className="text-center">VN</span><span className="text-center">EN</span></div>{services.map((service) => <div key={service.id} className="grid grid-cols-[1fr_repeat(3,72px)] gap-3 border-b border-border/60 py-3"><span className="truncate">{service.nameEn || service.slug}</span><span className="text-center">{service.nameKo && service.descKo ? "✓" : "—"}</span><span className="text-center">{service.nameVi && service.descVi ? "✓" : "—"}</span><span className="text-center">{service.nameEn && service.descEn ? "✓" : "—"}</span></div>)}</div></CardContent></Card>
  </div>
}
