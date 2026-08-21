"use client"

import { useState, useTransition } from "react"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { replyToQuestion } from "@/app/actions/questions"

export function QuestionReplyForm({ questionId }: { questionId: number }) {
  const [reply, setReply] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await replyToQuestion(questionId, reply)
      if (result.success) {
        setSent(true)
      } else {
        setError(result.error)
      }
    })
  }

  if (sent) {
    return <p className="text-sm text-muted-foreground">Reply sent to the customer&apos;s email.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write your reply..."
        rows={3}
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
