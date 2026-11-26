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
  const onRestoreRef = useRef(options.onRestore)
  const serverUpdatedAtRef = useRef(options.serverUpdatedAt)
  const delay = options.delay ?? 700

  useEffect(() => { latest.current = values }, [values])
  useEffect(() => { onRestoreRef.current = options.onRestore }, [options.onRestore])
  useEffect(() => { serverUpdatedAtRef.current = options.serverUpdatedAt }, [options.serverUpdatedAt])

  useEffect(() => {
    let active = true
    hydrated.current = false
    requestId.current += 1
    setStatus("loading")
    setDraft(null)
    setSavedAt(null)

    loadAdminDraft(editor, identity, options.serverUpdatedAt).then((result) => {
      if (!active) return
      if (result) {
        setDraft(result)
        setSavedAt(result.savedAt)
        onRestoreRef.current?.(result.values as T)
      }
      hydrated.current = true
      setStatus(result ? "saved" : "idle")
    }).catch(() => {
      if (!active) return
      hydrated.current = true
      setStatus("error")
    })

    return () => {
      active = false
      requestId.current += 1
    }
  }, [editor, identity, options.serverUpdatedAt])

  useEffect(() => {
    if (!hydrated.current) return

    let active = true
    const timeoutId = window.setTimeout(() => {
      const currentId = ++requestId.current
      setStatus("saving")

      void saveAdminDraft(editor, identity, latest.current, serverUpdatedAtRef.current)
        .then((result) => {
          if (!active || currentId !== requestId.current) return
          setSavedAt(result.savedAt)
          setStatus("saved")
        })
        .catch(() => {
          if (active && currentId === requestId.current) setStatus("error")
        })
    }, delay)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      requestId.current += 1
    }
  }, [values, editor, identity, delay])

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
