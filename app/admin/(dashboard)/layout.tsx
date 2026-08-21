import type React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"
import { AdminLogoutButton } from "@/components/admin/logout-button"
import { AdminNavLink } from "@/components/admin/nav-link"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const expected = await getExpectedAdminSessionToken()
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!expected || token !== expected) {
    redirect("/admin")
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/admin/dashboard" className="font-serif text-lg tracking-tight text-foreground">
            Lotus Wellness <span className="text-muted-foreground">Admin</span>
          </Link>
          <nav aria-label="Admin navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <AdminNavLink href="/admin/dashboard">Dashboard</AdminNavLink>
            <AdminNavLink href="/admin/pages">Content</AdminNavLink>
            <AdminNavLink href="/admin/hero">Hero</AdminNavLink>
            <AdminNavLink href="/admin/about">About</AdminNavLink>
            <AdminNavLink href="/admin/services">Services</AdminNavLink>
            <AdminNavLink href="/admin/therapists">Therapists</AdminNavLink>
            <AdminNavLink href="/admin/faq">FAQ</AdminNavLink>
            <AdminNavLink href="/admin/reviews">Reviews</AdminNavLink>
            <AdminNavLink href="/admin/promotions">Promotions</AdminNavLink>
            <span className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:inline">Operations</span>
            <AdminNavLink href="/admin/bookings">Bookings</AdminNavLink>
            <AdminNavLink href="/admin/customers">Customers</AdminNavLink>
            <AdminNavLink href="/admin/service-areas">Service areas</AdminNavLink>
            <AdminNavLink href="/admin/questions">Questions</AdminNavLink>
            <AdminNavLink href="/admin/membership">Membership</AdminNavLink>
            <span className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:inline">Settings</span>
            <AdminNavLink href="/admin/contact">Contact</AdminNavLink>
            <AdminNavLink href="/admin/booking-settings">Booking settings</AdminNavLink>
            <AdminNavLink href="/admin/media">Media</AdminNavLink>
            <AdminNavLink href="/admin/languages">Languages</AdminNavLink>
            <AdminNavLink href="/admin/preview">Preview</AdminNavLink>
            <AdminNavLink href="/admin/design">Design</AdminNavLink>
          </nav>
          <AdminLogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
