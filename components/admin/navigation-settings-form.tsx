"use client"

import { useActionState, useState } from "react"
import { updateNavigationSettings, type NavigationActionState } from "@/app/actions/navigation-settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export type NavigationItem = { menuKey: string; labelEn: string; labelVi: string; labelKo: string; href: string; visible: boolean; fontFamily: string; fontSize: string; fontWeight: string; textColor: string; hoverColor: string }
const defaults: NavigationItem[] = [
  { menuKey: "home", labelEn: "HOME", labelVi: "TRANG CHỦ", labelKo: "홈", href: "#top", visible: true, fontFamily: "inherit", fontSize: "sm", fontWeight: "normal", textColor: "inherit", hoverColor: "inherit" },
  { menuKey: "services", labelEn: "Services", labelVi: "Dịch vụ", labelKo: "서비스", href: "#services", visible: true, fontFamily: "inherit", fontSize: "sm", fontWeight: "normal", textColor: "inherit", hoverColor: "inherit" },
  { menuKey: "experts", labelEn: "Therapists", labelVi: "KTV", labelKo: "테라피스트", href: "#experts", visible: true, fontFamily: "inherit", fontSize: "sm", fontWeight: "normal", textColor: "inherit", hoverColor: "inherit" },
  { menuKey: "about", labelEn: "About", labelVi: "Giới thiệu", labelKo: "소개", href: "#about", visible: true, fontFamily: "inherit", fontSize: "sm", fontWeight: "normal", textColor: "inherit", hoverColor: "inherit" },
  { menuKey: "contact", labelEn: "Contact", labelVi: "Liên hệ", labelKo: "문의", href: "#contact", visible: true, fontFamily: "inherit", fontSize: "sm", fontWeight: "normal", textColor: "inherit", hoverColor: "inherit" },
]
const initialState: NavigationActionState = { success: false }

export function NavigationSettingsForm({ initial }: { initial: NavigationItem[] }) {
  const [items, setItems] = useState(initial.length ? initial : defaults)
  const [state, action, pending] = useActionState(updateNavigationSettings, initialState)
  const update = (index: number, key: keyof NavigationItem, value: string | boolean) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item))
  return <form action={action} className="flex flex-col gap-6">
    <input type="hidden" name="items" value={JSON.stringify(items)} />
    {items.map((item, index) => <Card key={item.menuKey}>
      <CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle className="font-serif text-xl">{item.menuKey}</CardTitle><CardDescription>{item.href}</CardDescription></div><div className="flex items-center gap-2"><Label htmlFor={`visible-${item.menuKey}`}>Visible</Label><Switch id={`visible-${item.menuKey}`} checked={item.visible} onCheckedChange={(value) => update(index, "visible", value)} /></div></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-2"><Label>English label</Label><Input value={item.labelEn} onChange={(event) => update(index, "labelEn", event.target.value)} /></div>
        <div className="flex flex-col gap-2"><Label>Vietnamese label</Label><Input value={item.labelVi} onChange={(event) => update(index, "labelVi", event.target.value)} /></div>
        <div className="flex flex-col gap-2"><Label>Korean label</Label><Input value={item.labelKo} onChange={(event) => update(index, "labelKo", event.target.value)} /></div>
        <div className="flex flex-col gap-2"><Label>Anchor link</Label><Input value={item.href} onChange={(event) => update(index, "href", event.target.value)} /></div>
        <div className="flex flex-col gap-2"><Label>Font family</Label><Input value={item.fontFamily} onChange={(event) => update(index, "fontFamily", event.target.value)} placeholder="inherit or serif" /></div>
        <div className="flex flex-col gap-2"><Label>Font size</Label><Input value={item.fontSize} onChange={(event) => update(index, "fontSize", event.target.value)} placeholder="sm, md, lg" /></div>
        <div className="flex flex-col gap-2"><Label>Font weight</Label><Input value={item.fontWeight} onChange={(event) => update(index, "fontWeight", event.target.value)} placeholder="normal or bold" /></div>
        <div className="flex flex-col gap-2"><Label>Text color</Label><Input value={item.textColor} onChange={(event) => update(index, "textColor", event.target.value)} placeholder="inherit or #..." /></div>
        <div className="flex flex-col gap-2"><Label>Hover color</Label><Input value={item.hoverColor} onChange={(event) => update(index, "hoverColor", event.target.value)} placeholder="inherit or #..." /></div>
      </CardContent>
    </Card>)}
    <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save navigation"}</Button>{state.success && <span className="text-sm text-muted-foreground">Saved.</span>}{state.error && <span className="text-sm text-destructive">{state.error}</span>}</div>
  </form>
}
