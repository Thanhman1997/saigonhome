import type React from "react"
import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { AdminShell } from "@/components/admin/admin-shell"
import { getAdminWebPushPublicKey } from "@/lib/admin-web-push"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin")
  }

  return <AdminShell applicationServerKey={getAdminWebPushPublicKey()}>{children}</AdminShell>
}
