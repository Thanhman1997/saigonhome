"use client"

import Link from "next/link"
import { useState } from "react"
import { BarChart3, BookOpen, CalendarDays, ChevronRight, ClipboardList, Eye, FileText, ImageIcon, Languages, LayoutDashboard, Menu, Palette, PanelsTopLeft, Settings2, Sparkles, Users, X } from "lucide-react"
import { AdminLogoutButton } from "@/components/admin/logout-button"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const groups = [
  { label: "Overview", items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Website", items: [{ href: "/admin/pages", label: "All content", icon: PanelsTopLeft }, { href: "/admin/content", label: "Section styles", icon: Palette }, { href: "/admin/hero", label: "Hero", icon: Sparkles }, { href: "/admin/about", label: "About", icon: BookOpen }, { href: "/admin/services", label: "Services", icon: ClipboardList }, { href: "/admin/services/content", label: "Services Content", icon: FileText }, { href: "/admin/therapists", label: "Therapists", icon: Users }, { href: "/admin/promotions", label: "Promotions", icon: FileText }, { href: "/admin/reviews", label: "Reviews", icon: BarChart3 }, { href: "/admin/faq", label: "FAQ", icon: BookOpen }] },
  { label: "Operations", items: [{ href: "/admin/bookings", label: "Bookings", icon: CalendarDays }, { href: "/admin/questions", label: "Questions", icon: ClipboardList }, { href: "/admin/membership", label: "Membership", icon: Users }] },
  { label: "Settings", items: [{ href: "/admin/navigation", label: "Navigation menu", icon: Menu }, { href: "/admin/design", label: "Design", icon: Palette }, { href: "/admin/media", label: "Media library", icon: ImageIcon }, { href: "/admin/languages", label: "Languages", icon: Languages }, { href: "/admin/contact", label: "Contact", icon: Settings2 }, { href: "/admin/booking-settings", label: "Booking settings", icon: Settings2 }, { href: "/admin/email-templates", label: "Booking emails", icon: Settings2 }, { href: "/admin/preview", label: "Preview", icon: Eye }] },
]

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return <nav aria-label="Admin navigation" className="flex flex-col gap-6">
    {groups.map((group) => <div key={group.label} className="flex flex-col gap-2">
      <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
      <div className="flex flex-col gap-1">{group.items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={onNavigate} className="group flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><span className="flex items-center gap-3"><Icon className="size-4" aria-hidden="true" />{label}</span><ChevronRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" /></Link>)}</div>
    </div>)}
  </nav>
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return <div className="min-h-svh bg-muted/20">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-background lg:flex">
      <div className="flex h-20 items-center border-b border-border px-6"><Link href="/admin/dashboard" className="font-serif text-xl tracking-tight text-foreground">Lotus Wellness <span className="text-muted-foreground">Admin</span></Link></div>
      <div className="flex-1 overflow-y-auto px-4 py-6"><Navigation /></div>
      <div className="border-t border-border p-4"><AdminLogoutButton /></div>
    </aside>
    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="flex items-center gap-3"><Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin navigation"><Menu className="size-5" /></Button></SheetTrigger><SheetContent side="left" className="w-80 px-0"><SheetHeader className="border-b border-border px-6"><SheetTitle className="font-serif text-xl">Lotus Wellness Admin</SheetTitle></SheetHeader><div className="overflow-y-auto px-4 py-6"><Navigation onNavigate={() => setOpen(false)} /></div><div className="mt-auto border-t border-border p-4"><AdminLogoutButton /></div></SheetContent></Sheet><div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Content studio</p><p className="font-serif text-lg text-foreground">Manage your experience</p></div></div>
        <Button asChild variant="outline" size="sm" className="hidden gap-2 sm:inline-flex"><Link href="/" target="_blank"><Eye className="size-4" />View site</Link></Button>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
    </div>
  </div>
}

export function AdminShellHeaderClose() { return <X className="size-4" aria-hidden="true" /> }
