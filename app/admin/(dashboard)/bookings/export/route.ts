import { NextResponse } from "next/server"
import { getAllBookingsWithRelations } from "@/lib/admin-data"
import { getExpectedAdminSessionToken } from "@/lib/admin-auth"
import { cookies } from "next/headers"

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const expected = await getExpectedAdminSessionToken()
  if (!expected || cookieStore.get("lw_admin_session")?.value !== expected) return new NextResponse("Unauthorized", { status: 401 })

  const url = new URL(request.url)
  const result = await getAllBookingsWithRelations({
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    therapistId: Number(url.searchParams.get("therapistId")) || undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    page: 1,
    pageSize: 1000,
  })
  const headers = ["Reference", "Customer", "Email", "Phone", "Service", "Therapist", "Date", "Time", "Guests", "Total VND", "Status"]
  const rows = result.rows.map((booking) => [booking.reference, booking.customerName, booking.email, booking.phone, booking.service?.nameEn, booking.therapist?.code ?? "No preference", booking.date, booking.time, booking.guests, booking.totalVnd, booking.status])
  const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"` } })
}
