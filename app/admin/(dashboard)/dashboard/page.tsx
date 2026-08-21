import { Card } from "@/components/ui/card"
import { db } from "@/lib/db"
import { heroContent } from "@/lib/db/schema"
import { getAdminDashboardMetrics } from "@/lib/admin-data"
import { formatVnd } from "@/lib/pricing"
import { CalendarDays, CircleX, Clock3, DollarSign, MessageCircleQuestion, Users } from "lucide-react"

export const metadata = { title: "Dashboard | Admin" }

export default async function DashboardPage() {
  const [heroes, metrics] = await Promise.all([
    db.select().from(heroContent).limit(1),
    getAdminDashboardMetrics(),
  ])
  const hero = heroes[0]
  const cards = [
    { label: "Today's bookings", value: metrics.todayBookings, href: "/admin/bookings?from=today", icon: CalendarDays, tone: "text-primary" },
    { label: "Pending bookings", value: metrics.pendingBookings, href: "/admin/bookings?status=pending", icon: Clock3, tone: "text-amber-600" },
    { label: "Revenue", value: formatVnd(metrics.revenueVnd), href: "/admin/bookings", icon: DollarSign, tone: "text-emerald-600" },
    { label: "Therapists available", value: metrics.availableTherapists, href: "/admin/therapists", icon: Users, tone: "text-sky-600" },
    { label: "Cancelled bookings", value: metrics.cancelledBookings, href: "/admin/bookings?status=cancelled", icon: CircleX, tone: "text-destructive" },
    { label: "Unanswered questions", value: metrics.unansweredQuestions, href: "/admin/questions", icon: MessageCircleQuestion, tone: "text-violet-600" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Manage your website content and operations</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <a key={card.label} href={card.href} className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground sm:text-sm">{card.label}</span>
                <Icon className={`size-4 shrink-0 ${card.tone}`} aria-hidden="true" />
              </div>
              <p className="mt-3 truncate text-xl font-semibold text-foreground sm:text-2xl">{card.value}</p>
              <span className="mt-2 block text-xs text-muted-foreground group-hover:text-primary">View details</span>
            </a>
          )
        })}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="font-semibold text-foreground">Website Content</h2>
          <p className="mt-1 text-sm text-muted-foreground">Edit hero, about, services, and more</p>
          <div className="mt-4 space-y-2 text-sm">
            <a href="/admin/hero" className="block text-primary hover:underline">Hero Section</a>
            <a href="/admin/about" className="block text-primary hover:underline">About Page</a>
            <a href="/admin/services" className="block text-primary hover:underline">Services</a>
            <a href="/admin/therapists" className="block text-primary hover:underline">Therapists</a>
            <a href="/admin/faq" className="block text-primary hover:underline">FAQ</a>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold text-foreground">Operations</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage bookings, questions, and reviews</p>
          <div className="mt-4 space-y-2 text-sm">
            <a href="/admin/bookings" className="block text-primary hover:underline">Bookings</a>
            <a href="/admin/questions" className="block text-primary hover:underline">Questions</a>
            <a href="/admin/reviews" className="block text-primary hover:underline">Reviews</a>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold text-foreground">Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">Configure site and design preferences</p>
          <div className="mt-4 space-y-2 text-sm">
            <a href="/admin/design" className="block text-primary hover:underline">Design Settings</a>
            <a href="/admin/languages" className="block text-primary hover:underline">Languages</a>
            <a href="/admin/media" className="block text-primary hover:underline">Media Library</a>
            <a href="/admin/contact" className="block text-primary hover:underline">Contact Info</a>
          </div>
        </Card>
      </div>
      {hero && (
        <Card className="p-6">
          <h2 className="font-semibold text-foreground">Quick Status</h2>
          <p className="mt-2 text-sm text-muted-foreground">Hero section is {hero.visible ? "visible" : "hidden"}. Last updated {new Date(hero.updatedAt).toLocaleDateString()}.</p>
        </Card>
      )}
    </div>
  )
}
