"use client"

import { Analytics } from "@vercel/analytics/next"
import { usePathname } from "next/navigation"

export function SiteAnalytics() {
  const pathname = usePathname()
  if (pathname === "/booking/manage") return null
  return <Analytics beforeSend={(event) => new URL(event.url, window.location.origin).pathname.replace(/\/$/, "") === "/booking/manage" ? null : event} />
}
