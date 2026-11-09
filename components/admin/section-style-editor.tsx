"use client"

import { useActionState } from "react"
import { updateSectionStyle } from "@/app/actions/section-styles"

const sections = [
  { key: "hero", label: "Phần đầu trang" },
  { key: "services", label: "Dịch vụ" },
  { key: "about", label: "Giới thiệu" },
  { key: "experts", label: "Chuyên viên" },
  { key: "promotions", label: "Khuyến mãi" },
  { key: "membership", label: "Gói hội viên" },
  { key: "reviews", label: "Đánh giá" },
  { key: "faq", label: "Câu hỏi thường gặp" },
  { key: "contact", label: "Liên hệ" },
]

export function SectionStyleEditor() {
  const [state, action, pending] = useActionState(async (_: { ok: boolean; error?: string }, formData: FormData) => {
    try { await updateSectionStyle(formData); return { ok: true } } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to save" } }
  }, { ok: false })
  return <div className="space-y-6">
    {sections.map((section) => <form key={section.key} action={action} className="grid gap-4 rounded-xl border border-border p-5 md:grid-cols-5">
      <legend className="px-2 font-semibold text-foreground">{section.label}</legend>
      <input type="hidden" name="sectionKey" value={section.key} />
      <label className="text-sm text-muted-foreground">Phông chữ tiêu đề<input name="headingFont" defaultValue="inherit" className="mt-1 w-full rounded-md border bg-background p-2 text-foreground" /></label>
      <label className="text-sm text-muted-foreground">Cỡ chữ tiêu đề<input name="headingSize" defaultValue="inherit" placeholder="2.5rem" className="mt-1 w-full rounded-md border bg-background p-2 text-foreground" /></label>
      <label className="text-sm text-muted-foreground">Màu tiêu đề<input name="headingColor" type="color" defaultValue="#c65d24" className="mt-1 h-10 w-full rounded-md border bg-background p-1" /></label>
      <label className="text-sm text-muted-foreground">Căn chỉnh tiêu đề<select name="headingAlign" defaultValue="center" className="mt-1 w-full rounded-md border bg-background p-2 text-foreground"><option value="left">Trái</option><option value="center">Giữa</option><option value="right">Phải</option></select></label>
      <label className="text-sm text-muted-foreground">Cỡ chữ nội dung<input name="bodySize" defaultValue="inherit" placeholder="1rem" className="mt-1 w-full rounded-md border bg-background p-2 text-foreground" /></label>
      <label className="text-sm text-muted-foreground">Màu nội dung<input name="bodyColor" type="color" defaultValue="#6b6255" className="mt-1 h-10 w-full rounded-md border bg-background p-1" /></label>
      <label className="text-sm text-muted-foreground">Căn chỉnh nội dung<select name="bodyAlign" defaultValue="center" className="mt-1 w-full rounded-md border bg-background p-2 text-foreground"><option value="left">Trái</option><option value="center">Giữa</option><option value="right">Phải</option></select></label>
      <button disabled={pending} className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">{pending ? "Đang lưu…" : "Lưu thay đổi"}</button>
    </form>)}
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state.ok && <p className="text-sm text-primary">Đã lưu thay đổi.</p>}
  </div>
}
