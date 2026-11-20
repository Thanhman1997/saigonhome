"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { BarChart3, Bell, BookOpen, CalendarDays, ChevronRight, ClipboardList, Eye, FileText, ImageIcon, Languages, LayoutDashboard, Menu, MessageCircle, Palette, PanelsTopLeft, Settings2, Sparkles, Users, Video, X } from "lucide-react"
import { AdminLogoutButton } from "@/components/admin/logout-button"
import { AdminPushNotifications } from "@/components/admin/admin-push-notifications"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const groups = [
  { label: "Overview", items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Website", items: [{ href: "/admin/pages", label: "All content", icon: PanelsTopLeft }, { href: "/admin/content", label: "Section styles", icon: Palette }, { href: "/admin/hero", label: "Hero", icon: Sparkles }, { href: "/admin/about", label: "About", icon: BookOpen }, { href: "/admin/services", label: "Services", icon: ClipboardList }, { href: "/admin/services/content", label: "Services Content", icon: FileText }, { href: "/admin/therapists", label: "Therapists", icon: Users }, { href: "/admin/promotions", label: "Promotions", icon: FileText }, { href: "/admin/holidays", label: "Vietnam holidays", icon: CalendarDays }, { href: "/admin/reviews", label: "Reviews", icon: BarChart3 }, { href: "/admin/faq", label: "FAQ", icon: BookOpen }] },
  { label: "Publishing", items: [{ href: "/admin/video", label: "Videos", icon: Video }] },
  { label: "Operations", items: [{ href: "/admin/bookings", label: "Bookings", icon: CalendarDays }, { href: "/admin/questions", label: "Questions", icon: ClipboardList }, { href: "/admin/membership", label: "Membership", icon: Users }] },
  { label: "Settings", items: [{ href: "/admin/navigation", label: "Navigation menu", icon: Menu }, { href: "/admin/design", label: "Design", icon: Palette }, { href: "/admin/media", label: "Media library", icon: ImageIcon }, { href: "/admin/languages", label: "Languages", icon: Languages }, { href: "/admin/contact", label: "Contact", icon: Settings2 }, { href: "/admin/kakao", label: "Kakao notifications", icon: MessageCircle }, { href: "/admin/booking-settings", label: "Booking settings", icon: Settings2 }, { href: "/admin/email-templates", label: "Booking emails", icon: Settings2 }, { href: "/admin/preview", label: "Preview", icon: Eye }] },
]

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return <nav aria-label="Admin navigation" className="flex flex-col gap-6">
    {groups.map((group) => <div key={group.label} className="flex flex-col gap-2">
      <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
      <div className="flex flex-col gap-1">{group.items.map(({ href, label, icon: Icon }) => { const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(`${href}/`)); return <Link key={href} href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><span className="flex items-center gap-3"><Icon className="size-4" aria-hidden="true" />{label}</span><ChevronRight className={`size-3 transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} aria-hidden="true" /></Link> })}</div>
    </div>)}
  </nav>
}

export function AdminShell({ children, applicationServerKey }: { children: React.ReactNode; applicationServerKey: string | null }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 80rem)")
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false)
    }
    desktop.addEventListener("change", closeOnDesktop)
    return () => desktop.removeEventListener("change", closeOnDesktop)
  }, [])

  return <div className="min-h-svh bg-muted/20">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-background xl:flex">
      <div className="flex h-20 shrink-0 items-center border-b border-border px-6"><Link href="/admin/dashboard" className="font-serif text-xl tracking-tight text-foreground">Lotus Wellness <span className="text-muted-foreground">Admin</span></Link></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6"><Navigation /></div>
      <div className="shrink-0 border-t border-border p-4"><AdminLogoutButton /></div>
    </aside>
    <div className="min-w-0 xl:pl-60">
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="shrink-0 xl:hidden" aria-label="Open admin navigation"><Menu className="size-5" /></Button></SheetTrigger>
            <SheetContent side="left" aria-describedby={undefined} className="w-80 max-w-[calc(100%_-_1rem)] gap-0 px-0">
              <SheetHeader className="shrink-0 border-b border-border pr-10 pl-5"><SheetTitle className="font-serif text-xl">Lotus Wellness Admin</SheetTitle></SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"><Navigation onNavigate={() => setOpen(false)} /></div>
              <div className="shrink-0 border-t border-border p-4"><AdminLogoutButton /></div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Content studio</p>
            <p className="font-serif text-sm leading-tight text-foreground sm:text-lg">Manage your experience</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Popover>
            <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2" aria-label="Message notifications"><Bell className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Notifications</span></Button></PopoverTrigger>
            <PopoverContent align="end" className="w-[min(92vw,26rem)] border-0 bg-transparent p-0 shadow-none"><AdminPushNotifications applicationServerKey={applicationServerKey} className="shadow-lg" /></PopoverContent>
          </Popover>
          <Button asChild variant="outline" size="sm"><Link href="/" target="_blank" aria-label="View site (opens in a new tab)"><Eye className="size-4" aria-hidden="true" /><span className="hidden sm:inline">View site</span></Link></Button>
        </div>
      </header>
      <main className="@container mx-auto w-full min-w-0 max-w-7xl px-4 py-5 wrap-anywhere sm:px-6 sm:py-8">{children}</main>
    </div>
  </div>
}

export function AdminShellHeaderClose() { return <X className="size-4" aria-hidden="true" /> }
