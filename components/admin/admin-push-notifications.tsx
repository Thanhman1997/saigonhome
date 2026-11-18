"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, BellRing, Loader2, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BrowserStatus = "checking" | "ready" | "subscribed" | "unsupported" | "error"

function decodeVapidKey(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const decoded = atob(padded)
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0))
}

function subscriptionUsesKey(subscription: PushSubscription, expectedKey: Uint8Array) {
  const currentKey = subscription.options.applicationServerKey
  if (!currentKey) return false
  const currentBytes = new Uint8Array(currentKey)
  return currentBytes.length === expectedKey.length && currentBytes.every((byte, index) => byte === expectedKey[index])
}

async function sendSubscriptionToServer(subscription: PushSubscription) {
  const response = await fetch("/api/admin/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "subscribe", subscription: subscription.toJSON() }),
  })
  if (!response.ok) throw new Error("Could not save this device. Please try again.")
}

async function removeSubscriptionFromServer(endpoint: string) {
  return fetch("/api/admin/push", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  })
}

export function AdminPushNotifications({ applicationServerKey, className }: { applicationServerKey: string | null; className?: string }) {
  const [status, setStatus] = useState<BrowserStatus>("checking")
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackIsError, setFeedbackIsError] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setStatus("unsupported")
      return
    }

    setPermission(Notification.permission)
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setStatus(subscription ? "subscribed" : "ready"))
      .catch(() => setStatus("error"))
  }, [])

  async function enableNotifications() {
    setBusy(true)
    setFeedback(null)
    setFeedbackIsError(false)

    try {
      if (!applicationServerKey) throw new Error("Push notifications are not configured for this admin account.")
      const nextPermission = await Notification.requestPermission()
      setPermission(nextPermission)
      if (nextPermission !== "granted") throw new Error("Allow notifications in your browser settings to continue.")

      const registration = await navigator.serviceWorker.ready
      const expectedKey = decodeVapidKey(applicationServerKey)
      let subscription = await registration.pushManager.getSubscription()

      if (subscription && !subscriptionUsesKey(subscription, expectedKey)) {
        const previousEndpoint = subscription.endpoint
        await subscription.unsubscribe()
        await removeSubscriptionFromServer(previousEndpoint).catch(() => undefined)
        subscription = null
      }

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: expectedKey.buffer as ArrayBuffer,
        })
      }

      await sendSubscriptionToServer(subscription)
      setStatus("subscribed")
      setFeedback("Notifications are enabled on this device.")
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not enable notifications. Please try again.")
      setFeedbackIsError(true)
    } finally {
      setBusy(false)
    }
  }

  async function disableNotifications() {
    setBusy(true)
    setFeedback(null)
    setFeedbackIsError(false)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        const response = await removeSubscriptionFromServer(subscription.endpoint)
        if (!response.ok) throw new Error("This device was disabled, but its saved subscription could not be removed.")
      }
      setStatus("ready")
      setFeedback("Notifications are disabled on this device.")
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not disable notifications. Please try again.")
      setFeedbackIsError(true)
    } finally {
      setBusy(false)
    }
  }

  async function sendTestNotification() {
    setBusy(true)
    setFeedback(null)
    setFeedbackIsError(false)

    try {
      const response = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Could not send a test notification.")
      setFeedback("Test notification sent. Check this device.")
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not send a test notification.")
      setFeedbackIsError(true)
    } finally {
      setBusy(false)
    }
  }

  const disabled = busy || status === "checking" || status === "unsupported" || status === "error" || !applicationServerKey

  return (
    <section aria-labelledby="admin-push-title" className={cn("flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
            <BellRing aria-hidden="true" className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 id="admin-push-title" className="font-medium text-foreground">Message notifications</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Get a browser notification when a customer sends a question. Notifications show no customer details.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {status === "subscribed" ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={sendTestNotification} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Bell data-icon="inline-start" />}
                Send test
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={disableNotifications} disabled={busy}>
                <BellOff data-icon="inline-start" />
                Turn off
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" onClick={enableNotifications} disabled={disabled}>
              {busy || status === "checking" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Bell data-icon="inline-start" />}
              {busy ? "Please wait…" : status === "checking" ? "Checking…" : "Enable on this device"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Smartphone aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>On iPhone or iPad, add this website to the Home Screen before enabling notifications. Enable notifications separately on each device.</p>
      </div>

      {status === "unsupported" && (
        <p role="status" className="text-sm text-muted-foreground">This browser does not support Web Push notifications. Try a current browser over HTTPS.</p>
      )}
      {status === "error" && (
        <p role="alert" className="text-sm text-destructive">Could not prepare this browser for notifications. Refresh the page and try again.</p>
      )}
      {!applicationServerKey && (
        <p role="alert" className="text-sm text-destructive">Admin notification settings are unavailable because the admin credentials are not configured.</p>
      )}
      {permission === "denied" && status !== "subscribed" && (
        <p role="status" className="text-sm text-muted-foreground">Notifications are blocked by this browser. Allow them in the site settings, then refresh this page.</p>
      )}
      {feedback && <p role={feedbackIsError ? "alert" : "status"} className={feedbackIsError ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{feedback}</p>}
    </section>
  )
}
