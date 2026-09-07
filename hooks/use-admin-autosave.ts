"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { clearAdminDraft, loadAdminDraft, saveAdminDraft } from "@/app/actions/drafts"
import type { DraftEnvelope } from "@/app/actions/drafts"

export type AdminAutosaveStatus = "idle" | "loading" | "saving" | "saved" | "error"

export function useAdminAutosave<T extends Record<string, unknown>>(
  editor: string,
  identity: string,
  values: T,
  options: { serverUpdatedAt?: string | null; onRestore?: (values: T) => void; delay?: number } = {},
) {
  const [status, setStatus] = useState<AdminAutosaveStatus>("loading")
  const [draft, setDraft] = useState<DraftEnvelope | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const latest = useRef(values)
  const requestId = useRef(0)
  const hydrated = useRef(false)
  const onRestore = options.onRestore
  const delay = options.delay ?? 700

  useEffect(() => { latest.current = values }, [values])

  useEffect(() => {
    let active = true
    setStatus("loading")
    loadAdminDraft(editor, identity, options.serverUpdatedAt).then((result) => {
      if (!active) return
      if (result) { setDraft(result); setSavedAt(result.savedAt); onRestore?.(result.values as T) }
      setStatus(result ? "saved" : "idle")
      hydrated.current = true
    }).catch(() => { if (active) { setStatus("error"); hydrated.current = true } })
    return () => { active = false }
  }, [editor, identity, options.serverUpdatedAt, onRestore])

  useEffect(() => {
    if (!hydrated.current) return
    const id = window.setTimeout(async () => {
      const currentId = ++requestId.current
      setStatus("saving")
      try {
        const result = await saveAdminDraft(editor, identity, latest.current, options.serverUpdatedAt)
        if (currentId !== requestId.current) return
        setSavedAt(result.savedAt); setStatus("saved")
      } catch { if (currentId === requestId.current) setStatus("error") }
    }, delay)
    return () => window.clearTimeout(id)
  }, [values, editor, identity, options.serverUpdatedAt, delay])

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (status === "saving") { event.preventDefault(); event.returnValue = "" } }
    window.addEventListener("beforeunload", guard)
    return () => window.removeEventListener("beforeunload", guard)
  }, [status])

  const discard = useCallback(async () => {
    await clearAdminDraft(editor, identity)
    setDraft(null); setSavedAt(null); setStatus("idle")
  }, [editor, identity])

  return { status, draftValues: draft?.values as T | undefined, savedAt, discard }
}
