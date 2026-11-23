import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { AdminLoginForm } from "@/components/admin/login-form"

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
}

export default async function AdminEntryPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/dashboard")
  }

  return <AdminLoginForm />
}
