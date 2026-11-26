import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
  other: { google: "notranslate" },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div translate="no" lang="en" className="notranslate min-h-svh bg-muted/40 font-sans">
      {children}
    </div>
  )
}
