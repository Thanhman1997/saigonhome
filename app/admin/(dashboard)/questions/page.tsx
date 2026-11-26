import { getAllQuestions } from "@/lib/admin-data"
import { AdminPushNotifications } from "@/components/admin/admin-push-notifications"
import { QuestionReplyForm, ResendReplyEmailButton } from "@/components/admin/question-reply-form"
import { Badge } from "@/components/ui/badge"
import { getAdminWebPushPublicKey } from "@/lib/admin-web-push"

export const metadata = { title: "Questions" }

export default async function AdminQuestionsPage() {
  const questions = await getAllQuestions()
  const pendingCount = questions.filter((q) => q.status === "pending").length
  const applicationServerKey = getAdminWebPushPublicKey()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Questions</h1>
        <p className="text-sm text-muted-foreground">
          {questions.length} total question{questions.length === 1 ? "" : "s"} · {pendingCount} pending reply
        </p>
      </div>

      <AdminPushNotifications applicationServerKey={applicationServerKey} />

      <div className="flex flex-col gap-3">
        {questions.map((q) => (
          <div key={q.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{q.name}</span>
                <span className="text-xs text-muted-foreground">{q.email}</span>
                {q.phone && <span className="text-xs text-muted-foreground">{q.phone}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(q.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <Badge variant={q.status === "pending" ? "secondary" : "outline"}>
                  {q.status === "pending" ? "Pending" : "Answered"}
                </Badge>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{q.question}</p>

            {q.reply && (
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">Your reply</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/90">{q.reply}</p>
              </div>
            )}

            {q.status === "pending" && <QuestionReplyForm questionId={q.id} />}
            {q.status === "answered" && q.reply && q.replyEmailStatus !== "sent" && (
              <div className="flex flex-col gap-2">
                <p role="alert" className="text-sm text-destructive">
                  The reply email has not been delivered to the customer.
                </p>
                <ResendReplyEmailButton questionId={q.id} />
              </div>
            )}
          </div>
        ))}
        {questions.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-muted-foreground">
            No questions yet.
          </div>
        )}
      </div>
    </div>
  )
}
