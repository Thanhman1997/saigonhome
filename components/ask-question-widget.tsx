"use client"

import { useState } from "react"
import { MessageCircleQuestion, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/lib/i18n/language-provider"
import { askQuestion } from "@/app/actions/questions"

export function AskQuestionWidget() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [question, setQuestion] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetAndClose() {
    setOpen(false)
    setName("")
    setEmail("")
    setQuestion("")
    setSuccess(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await askQuestion({ name, email, question })
    setSubmitting(false)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-12 gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-[0_10px_30px_-16px_var(--accent)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-accent/90 sm:bottom-6 sm:right-6 sm:h-14 sm:px-5"
      >
        <MessageCircleQuestion className="size-5" />
        <span className="hidden sm:inline">{t.askQuestion.trigger}</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) resetAndClose()
          else setOpen(true)
        }}
      >
        <DialogContent className="sm:max-w-md">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle2 className="size-12 text-primary" />
              <p className="text-base leading-relaxed">{t.askQuestion.success}</p>
              <Button onClick={resetAndClose} variant="outline" className="mt-2">
                {t.askQuestion.close}
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl font-light">{t.askQuestion.title}</DialogTitle>
                <DialogDescription>{t.askQuestion.description}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="aq-name">{t.askQuestion.name}</Label>
                  <Input id="aq-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="aq-email">{t.askQuestion.email}</Label>
                  <Input
                    id="aq-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={200}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="aq-question">{t.askQuestion.question}</Label>
                  <Textarea
                    id="aq-question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                    maxLength={2000}
                    rows={4}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={submitting} className="mt-1 h-12 font-bold">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {t.askQuestion.submitting}
                    </span>
                  ) : (
                    t.askQuestion.submit
                  )}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
