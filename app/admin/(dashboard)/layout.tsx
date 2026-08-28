import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"
import { AdminShell } from "@/components/admin/admin-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const expected = await getExpectedAdminSessionToken()
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!expected || token !== expected) {
    redirect("/admin")
  }

  return <AdminShell>{children}</AdminShell>
}
