"use client"

import { useEffect, useRef, useState } from "react"
import { saveAdminDraft } from "@/app/actions/drafts"

export function useAdminAutosave(editor: string, locale: string, values: Record<string, string>) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    setStatus("saving")
    const timer = window.setTimeout(async () => {
      try { await saveAdminDraft(editor, locale, values); setStatus("saved") }
      catch { setStatus("error") }
    }, 700)
    return () => window.clearTimeout(timer)
  }, [editor, locale, values])
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (status === "saving") { event.preventDefault(); event.returnValue = "" } }
    window.addEventListener("beforeunload", guard)
    return () => window.removeEventListener("beforeunload", guard)
  }, [status])
  return status
}
