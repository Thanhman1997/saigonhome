"use client"

import { useState, useTransition } from "react"
import { Loader2, RotateCw, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { replyToQuestion, resendQuestionReplyEmail } from "@/app/actions/questions"

export function QuestionReplyForm({ questionId }: { questionId: number }) {
  const [reply, setReply] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<"sent" | "email-failed" | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await replyToQuestion(questionId, reply)
      if (result.success) {
        setOutcome(result.emailSent ? "sent" : "email-failed")
      } else {
        setError(result.error)
      }
    })
  }

  if (outcome === "sent") {
    return <p className="text-sm text-muted-foreground">Reply sent to the customer&apos;s email.</p>
  }

  if (outcome === "email-failed") {
    return (
      <p role="alert" className="text-sm text-destructive">
        Your reply was saved, but the email could not be sent. Use &quot;Resend email&quot; after refreshing.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write your reply..."
        rows={3}
        maxLength={5000}
        required
        disabled={isPending}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={isPending} className="w-fit gap-2">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Send reply
      </Button>
    </form>
  )
}

export function ResendReplyEmailButton({ questionId }: { questionId: number }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleClick() {
    setMessage(null)
    startTransition(async () => {
      const result = await resendQuestionReplyEmail(questionId)
      if (!result.success) setMessage(result.error)
      else setMessage(result.emailSent ? "Email sent." : "Email still failed. Try again later.")
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" size="sm" variant="outline" onClick={handleClick} disabled={isPending} className="gap-2">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCw className="size-4" />}
        Resend email
      </Button>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  )
}
