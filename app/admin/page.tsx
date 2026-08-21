import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, getExpectedAdminSessionToken } from "@/lib/admin-auth"
import { AdminLoginForm } from "@/components/admin/login-form"

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
}

export default async function AdminEntryPage() {
  const expected = await getExpectedAdminSessionToken()
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (expected && token === expected) {
    redirect("/admin/dashboard")
  }

  return <AdminLoginForm />
}
