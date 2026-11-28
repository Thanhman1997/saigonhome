"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Search, X } from "lucide-react"
import { updateBookingStatus } from "@/app/actions/admin"
import { BookingStatusSelect } from "@/components/admin/booking-status-select"
import { MarkPaidButton } from "@/components/admin/mark-paid-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AdminBookingOverviewBooking } from "@/lib/admin-data"
import { formatVnd } from "@/lib/pricing"

const PAGE_SIZE = 10
const timeFormatter = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short", day: "2-digit", month: "short", year: "numeric" })
const statusLabels: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  rejected: "Đã từ chối",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
}
const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  rejected: "destructive",
  completed: "outline",
  cancelled: "destructive",
}
const tabs = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "rejected", label: "Đã từ chối" },
  { value: "completed", label: "Hoàn thành" },
  { value: "all", label: "Tất cả lịch" },
] as const

type BookingTab = (typeof tabs)[number]["value"]

function statusCount(bookings: AdminBookingOverviewBooking[], status: string) {
  return bookings.filter((booking) => booking.status === status).length
}

function formatDate(date: Date | string) {
  return dateFormatter.format(new Date(date))
}

function formatTime(date: Date | string) {
  return timeFormatter.format(new Date(date))
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariants[status] ?? "outline"}>{statusLabels[status] ?? status}</Badge>
}

export function AdminBookingOverview({ bookings }: { bookings: AdminBookingOverviewBooking[] }) {
  const [activeTab, setActiveTab] = useState<BookingTab>("pending")
  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [therapistFilter, setTherapistFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState<{ bookingId: number; text: string } | null>(null)
  const [isUpdating, startTransition] = useTransition()

  const counts = useMemo(() => ({
    all: bookings.length,
    pending: statusCount(bookings, "pending"),
    confirmed: statusCount(bookings, "confirmed"),
    rejected: statusCount(bookings, "rejected"),
    completed: statusCount(bookings, "completed"),
  }), [bookings])

  const serviceOptions = useMemo(() => {
    const unique = new Map<number, string>()
    bookings.forEach((booking) => unique.set(booking.serviceId, booking.serviceName ?? "Dịch vụ"))
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1], "vi"))
  }, [bookings])

  const therapistOptions = useMemo(() => {
    const unique = new Map<number, string>()
    bookings.forEach((booking) => {
      if (booking.therapistId !== null && booking.therapistCode) unique.set(booking.therapistId, booking.therapistCode)
    })
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1], "vi"))
  }, [bookings])

  const visibleBookings = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi-VN")
    return bookings.filter((booking) => {
      const matchesTab = activeTab === "all" || booking.status === activeTab
      const matchesStatus = activeTab !== "all" || statusFilter === "all" || booking.status === statusFilter
      const matchesDate = !dateFilter || booking.date === dateFilter
      const matchesService = serviceFilter === "all" || String(booking.serviceId) === serviceFilter
      const matchesTherapist = therapistFilter === "all" || String(booking.therapistId ?? "none") === therapistFilter
      const haystack = `${booking.reference} ${booking.customerName} ${booking.phone} ${booking.email} ${booking.serviceName ?? ""} ${booking.therapistCode ?? ""}`.toLocaleLowerCase("vi-VN")
      return matchesTab && matchesStatus && matchesDate && matchesService && matchesTherapist && (!query || haystack.includes(query))
    }).sort((a, b) => {
      const aTime = new Date(a.startAt).getTime()
      const bTime = new Date(b.startAt).getTime()
      return activeTab === "pending" || activeTab === "confirmed" ? aTime - bTime : bTime - aTime
    })
  }, [activeTab, bookings, dateFilter, search, serviceFilter, statusFilter, therapistFilter])

  const pageCount = Math.max(1, Math.ceil(visibleBookings.length / PAGE_SIZE))
  const pageBookings = visibleBookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const firstResult = visibleBookings.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastResult = Math.min(page * PAGE_SIZE, visibleBookings.length)

  function resetFilters() {
    setSearch("")
    setDateFilter("")
    setServiceFilter("all")
    setTherapistFilter("all")
    setStatusFilter("all")
    setPage(1)
  }

  function changePendingStatus(bookingId: number, status: "confirmed" | "rejected") {
    if (status === "rejected" && !window.confirm("Bạn có chắc muốn từ chối lịch đặt này?")) return
    startTransition(async () => {
      setNotice(null)
      setPage(1)
      try {
        await updateBookingStatus(bookingId, status)
        setNotice({ bookingId, text: status === "confirmed" ? "Đã xác nhận lịch đặt." : "Đã từ chối lịch đặt." })
      } catch {
        setNotice({ bookingId, text: "Không thể cập nhật. Hãy tải lại trang và thử lại." })
      }
    })
  }

  return (
    <section aria-labelledby="booking-overview-title" className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Quản lý đặt lịch</p>
          <h2 id="booking-overview-title" className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Tình trạng lịch đặt</h2>
        </div>
        <Link href="/admin/bookings" className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Xem trang quản lý đầy đủ <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </header>

      <section aria-label="Thống kê lịch đặt" className="grid grid-cols-2 gap-3 @min-[50rem]:grid-cols-5">
        {[
          { value: "all", label: "Tổng lịch đặt", count: counts.all },
          { value: "pending", label: "Chờ xác nhận", count: counts.pending },
          { value: "confirmed", label: "Đã xác nhận", count: counts.confirmed },
          { value: "rejected", label: "Đã từ chối", count: counts.rejected },
          { value: "completed", label: "Hoàn thành", count: counts.completed },
        ].map((metric) => (
          <button key={metric.value} type="button" onClick={() => { setActiveTab(metric.value as BookingTab); setPage(1) }} className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold leading-none tabular-nums text-foreground">{metric.count}</p></CardContent>
            </Card>
          </button>
        ))}
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="gap-4 border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Danh sách theo trạng thái</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Mỗi lịch chỉ nằm trong một nhóm trạng thái.</p>
            </div>
            <p className="text-sm text-muted-foreground">{visibleBookings.length} lịch phù hợp</p>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Label htmlFor="booking-search" className="text-xs text-muted-foreground">Tìm khách, số điện thoại, mã lịch</Label>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="booking-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Nhập tên, số điện thoại hoặc mã lịch" className="pl-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:flex xl:flex-wrap">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="booking-date-filter" className="text-xs text-muted-foreground">Ngày hẹn</Label>
                <Input id="booking-date-filter" type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1) }} className="w-full xl:w-40" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="booking-service-filter" className="text-xs text-muted-foreground">Dịch vụ</Label>
                <Select value={serviceFilter} onValueChange={(value) => { setServiceFilter(value); setPage(1) }}>
                  <SelectTrigger id="booking-service-filter" className="w-full xl:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectGroup><SelectItem value="all">Tất cả dịch vụ</SelectItem>{serviceOptions.map(([id, name]) => <SelectItem key={id} value={String(id)}>{name}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="booking-therapist-filter" className="text-xs text-muted-foreground">Chuyên viên</Label>
                <Select value={therapistFilter} onValueChange={(value) => { setTherapistFilter(value); setPage(1) }}>
                  <SelectTrigger id="booking-therapist-filter" className="w-full xl:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectGroup><SelectItem value="all">Tất cả chuyên viên</SelectItem><SelectItem value="none">Chưa chọn</SelectItem>{therapistOptions.map(([id, code]) => <SelectItem key={id} value={String(id)}>{code}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </div>
              {activeTab === "all" && <div className="flex flex-col gap-1.5">
                <Label htmlFor="booking-status-filter" className="text-xs text-muted-foreground">Trạng thái</Label>
                <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
                  <SelectTrigger id="booking-status-filter" className="w-full xl:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectGroup><SelectItem value="all">Tất cả trạng thái</SelectItem>{["pending", "confirmed", "rejected", "completed", "cancelled"].map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </div>}
              <div className="flex items-end">
                <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="w-full xl:w-auto"><X data-icon="inline-start" aria-hidden="true" />Xóa lọc</Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value as BookingTab); setPage(1) }} aria-label="Nhóm trạng thái lịch đặt">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-none border-b border-border bg-muted/30 p-2 sm:grid-cols-3 lg:grid-cols-5">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="h-auto min-h-10 justify-between gap-2 rounded-md px-3 py-2 text-left data-[state=active]:bg-background data-[state=active]:text-foreground">
                <span className="whitespace-normal">{tab.label}</span>
                <Badge variant={activeTab === tab.value ? "default" : "secondary"} className="min-w-7 justify-center tabular-nums">{counts[tab.value]}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0 p-3 sm:p-5">
              {activeTab === tab.value && (pageBookings.length > 0 ? (
                <>
                  <ol className="flex flex-col gap-3">
                    {pageBookings.map((booking) => (
                      <li key={booking.id}>
                        <article className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-foreground">{booking.reference}</span>
                              <StatusBadge status={booking.status} />
                              {booking.status === "rejected" && booking.rejectedAt && <span className="text-xs text-muted-foreground">Từ chối lúc {new Date(booking.rejectedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span>}
                            </div>
                            <Link href="/admin/bookings" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Chi tiết đầy đủ</Link>
                          </div>

                          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Khách hàng</dt><dd className="mt-1 truncate font-medium text-foreground">{booking.customerName}</dd><dd className="truncate text-sm text-muted-foreground"><a href={`tel:${booking.phone}`} className="hover:text-primary">{booking.phone}</a></dd><dd className="truncate text-sm text-muted-foreground">{booking.email}</dd></div>
                            <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dịch vụ</dt><dd className="mt-1 truncate font-medium text-foreground">{booking.serviceName ?? "Dịch vụ"}</dd><dd className="text-sm text-muted-foreground">{booking.durationMinutes} phút · {booking.guests} khách</dd><dd className="text-sm text-muted-foreground">Chuyên viên: {booking.therapistCode ?? "Chưa chọn"}</dd></div>
                            <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Thời gian hẹn</dt><dd className="mt-1 flex items-center gap-2 font-medium text-foreground"><CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />{formatDate(booking.startAt)}</dd><dd className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 aria-hidden="true" className="size-4 shrink-0" />{formatTime(booking.startAt)}–{formatTime(booking.endAt)}</dd></div>
                            <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Thanh toán</dt><dd className="mt-1 font-medium text-foreground">{formatVnd(booking.totalVnd)}</dd><dd className="text-sm text-muted-foreground">{booking.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản" : "Tiền mặt"} · {booking.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}</dd></div>
                          </dl>

                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {booking.status === "pending" ? <>
                                <Button type="button" size="sm" disabled={isUpdating} onClick={() => changePendingStatus(booking.id, "confirmed")}><Check data-icon="inline-start" aria-hidden="true" />Xác nhận</Button>
                                <Button type="button" size="sm" variant="outline" disabled={isUpdating} onClick={() => changePendingStatus(booking.id, "rejected")}><X data-icon="inline-start" aria-hidden="true" />Từ chối</Button>
                              </> : <BookingStatusSelect bookingId={booking.id} status={booking.status} revoked={Boolean(booking.accessTokenRevokedAt)} />}
                              {booking.paymentStatus === "PENDING_PAYMENT" && ["confirmed", "completed"].includes(booking.status) && <MarkPaidButton bookingId={booking.id} />}
                            </div>
                            {notice?.bookingId === booking.id && <p role="status" className="text-sm text-muted-foreground">{notice.text}</p>}
                          </div>
                        </article>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <p aria-live="polite" className="text-sm text-muted-foreground">Hiển thị {firstResult}–{lastResult} trên {visibleBookings.length} lịch</p>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ArrowLeft data-icon="inline-start" aria-hidden="true" />Trước</Button>
                      <span className="min-w-20 text-center text-sm tabular-nums text-muted-foreground">{page} / {pageCount}</span>
                      <Button type="button" variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Sau<ArrowRight data-icon="inline-end" aria-hidden="true" /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <Empty className="min-h-60 border border-dashed border-border">
                  <EmptyHeader>
                    <EmptyTitle>{visibleBookings.length === 0 && (search || dateFilter || serviceFilter !== "all" || therapistFilter !== "all" || statusFilter !== "all") ? "Không tìm thấy lịch phù hợp" : "Chưa có lịch trong nhóm này"}</EmptyTitle>
                    <EmptyDescription>{activeTab === "pending" ? "Lịch khách vừa gửi sẽ xuất hiện tại đây để bạn xác nhận hoặc từ chối." : "Các lịch đặt sẽ tự chuyển nhóm khi trạng thái được cập nhật."}</EmptyDescription>
                  </EmptyHeader>
                  {(search || dateFilter || serviceFilter !== "all" || therapistFilter !== "all" || statusFilter !== "all") && <Button type="button" variant="outline" onClick={resetFilters}>Xóa bộ lọc</Button>}
                </Empty>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </section>
  )
}
