"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type SettingsSnapshot = {
  connection: {
    scopes: string[]
    status: string
    verifiedAt: Date
  } | null
  lastNotification: {
    status: string
    notificationType: string
    attemptCount: number
    sentAt: Date | null
    lastAttemptAt: Date | null
    createdAt: Date
    lastError: string | null
  } | null
  failedCount: number
}

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Kakao credentials and redirect URI must be configured in Vercel before connecting.",
  state: "The Kakao authorization expired or could not be verified. Please connect again.",
  cancelled: "Kakao authorization was cancelled.",
  authorization_failed: "Kakao authorization or permission verification failed. Check the Kakao app scopes, then try again.",
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value))
}

export function KakaoNotificationSettings({
  snapshot,
  canConnect,
  errorCode,
  connected,
}: {
  snapshot: SettingsSnapshot
  canConnect: boolean
  errorCode?: string
  connected?: boolean
}) {
  const router = useRouter()
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(connected ? "The admin Kakao account was authorized and connected." : null)
  const [feedbackIsError, setFeedbackIsError] = useState(false)
  const connection = snapshot.connection

  async function runAction(action: "test" | "retry" | "disconnect") {
    setBusyAction(action)
    setFeedback(null)
    setFeedbackIsError(false)

    try {
      const response = await fetch(action === "disconnect" ? "/api/kakao/disconnect" : "/api/kakao/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: action === "disconnect" ? undefined : JSON.stringify({ action }),
      })
      const result = await response.json().catch(() => ({})) as { status?: string; sent?: number; reset?: number; error?: string }

      if (!response.ok) {
        throw new Error(result.error ?? (result.status === "blocked" ? "Connect and verify KakaoTalk before sending notifications." : "The request could not be completed."))
      }

      if (action === "test") {
        setFeedback("Kakao accepted the test message. Check KakaoTalk My Chatroom (나와의 채팅) to confirm it arrived.")
      } else if (action === "retry") {
        setFeedback(`Retry run finished. ${result.sent ?? 0} notification(s) were accepted by Kakao.`)
      } else {
        setFeedback("KakaoTalk was disconnected. New customer messages will be saved, but notifications are paused.")
      }
      router.refresh()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "The request could not be completed.")
      setFeedbackIsError(true)
    } finally {
      setBusyAction(null)
    }
  }

  const callbackError = errorCode ? ERROR_MESSAGES[errorCode] : undefined
  const latest = snapshot.lastNotification

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Settings / notifications</p>
        <h1 className="text-2xl font-semibold text-foreground">KakaoTalk notifications</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Customer questions and booking requests are saved before Kakao delivery is attempted. Messages go only to the connected admin account&apos;s KakaoTalk My Chatroom.
        </p>
      </header>

      {callbackError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{callbackError}</p>}
      {feedback && <p role={feedbackIsError ? "alert" : "status"} aria-live="polite" className={`rounded-md border px-4 py-3 text-sm ${feedbackIsError ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-muted/40 text-foreground"}`}>{feedback}</p>}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Admin account</CardTitle>
              <CardDescription className="mt-1">Only an authenticated website admin can start OAuth. The requested Kakao permission is talk_message.</CardDescription>
            </div>
            <Badge variant={connection ? "default" : "secondary"}>{connection ? "Connected · admin authorized" : "Not connected"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Connection owner</dt><dd className="mt-1 text-sm text-foreground">Signed-in website admin</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Message destination</dt><dd className="mt-1 text-sm text-foreground">KakaoTalk My Chatroom (나와의 채팅)</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">OAuth permission</dt><dd className="mt-1 text-sm text-foreground">talk_message only</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Connection</dt><dd className="mt-1 text-sm text-foreground">{connection ? "Authorized for admin notifications" : "Waiting for admin authorization"}</dd></div>
            {connection && <>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Connected at (Vietnam time)</dt><dd className="mt-1 text-sm text-foreground">{formatDate(connection.verifiedAt)}</dd></div>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Granted permissions</dt><dd className="mt-1 break-words text-sm text-foreground">{connection.scopes.join(", ")}</dd></div>
            </>}
          </dl>

          {connection && connection.scopes.some((scope) => scope !== "talk_message") && <p role="status" className="rounded-md border border-border bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">
            This saved authorization includes older permissions. Disconnect and reconnect KakaoTalk to replace it with the current talk_message-only authorization.
          </p>}

          {!canConnect && <p className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed text-muted-foreground">
            Set <code className="font-mono text-foreground">KAKAO_REST_API_KEY</code>, <code className="font-mono text-foreground">KAKAO_CLIENT_SECRET</code>, <code className="font-mono text-foreground">KAKAO_REDIRECT_URI</code>, and <code className="font-mono text-foreground">KAKAO_TOKEN_ENCRYPTION_KEY</code> as server-side Vercel environment variables; do not prefix Kakao credentials with <code className="font-mono text-foreground">NEXT_PUBLIC_</code>. The redirect URI must exactly match the value registered in Kakao Developers. Scheduled retries also require <code className="font-mono text-foreground">CRON_SECRET</code>.
          </p>}

          <div className="flex flex-wrap gap-3">
            {!connection ? (
              canConnect ? <Button asChild><a href="/api/kakao/login" target="_blank" rel="noopener noreferrer">Connect KakaoTalk</a></Button> : <Button disabled>Connect KakaoTalk</Button>
            ) : (
              <>
                <Button onClick={() => void runAction("test")} disabled={busyAction !== null}>
                  {busyAction === "test" ? "Sending test…" : "Send test notification"}
                </Button>
                <Button variant="outline" onClick={() => void runAction("disconnect")} disabled={busyAction !== null}>
                  {busyAction === "disconnect" ? "Disconnecting…" : "Disconnect KakaoTalk"}
                </Button>
              </>
            )}
            {snapshot.failedCount > 0 && connection && <Button variant="outline" onClick={() => void runAction("retry")} disabled={busyAction !== null}>
              {busyAction === "retry" ? "Retrying…" : `Retry failed notifications (${snapshot.failedCount})`}
            </Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest notification</CardTitle>
          <CardDescription>Delivery status is recorded for each customer question, booking request, and test message.</CardDescription>
        </CardHeader>
        <CardContent>
          {latest ? (
            <dl className="grid gap-4 sm:grid-cols-3">
              <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</dt><dd className="mt-1 text-sm capitalize text-foreground">{latest.status.replaceAll("-", " ")}</dd></div>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</dt><dd className="mt-1 text-sm capitalize text-foreground">{latest.notificationType}</dd></div>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last attempt / created</dt><dd className="mt-1 text-sm text-foreground">{formatDate(latest.lastAttemptAt ?? latest.sentAt ?? latest.createdAt)}</dd></div>
              {latest.lastError && <div className="sm:col-span-3"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Latest issue</dt><dd className="mt-1 text-sm text-muted-foreground">{latest.lastError}</dd></div>}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No Kakao notifications have been attempted yet.</p>
          )}
        </CardContent>
      </Card>

      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Kakao&apos;s text memo is limited to 200 characters. Question notices include a short preview; booking notices include the reference, service, date, and time. Full customer details remain in the admin dashboard. A successful API response means Kakao accepted the message; confirm arrival in My Chatroom with the test button. Scheduled retries follow the cron schedule in vercel.json.
      </p>

    </div>
  )
}
