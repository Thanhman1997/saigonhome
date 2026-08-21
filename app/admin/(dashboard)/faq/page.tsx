import { getAllFaqsAdmin } from "@/lib/admin-data"
import { FaqFormDialog } from "@/components/admin/faq-form-dialog"
import { FaqRowControls } from "@/components/admin/faq-row-controls"

export const metadata = { title: "FAQ" }

export default async function AdminFaqPage() {
  const faqs = await getAllFaqsAdmin()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">FAQ</h1>
          <p className="text-sm text-muted-foreground">
            {faqs.length} question{faqs.length === 1 ? "" : "s"} · shown on the public site in the order below
          </p>
        </div>
        <FaqFormDialog />
      </div>

      <div className="flex flex-col gap-3">
        {faqs.map((faq, index) => (
          <div
            key={faq.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="font-medium text-foreground">{faq.questionEn}</span>
              <span className="text-sm text-muted-foreground">{faq.questionKo}</span>
              <span className="text-sm text-muted-foreground">{faq.questionVi}</span>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">{faq.answerEn}</p>
            </div>
            <div className="flex items-center gap-1">
              <FaqRowControls
                faqId={faq.id}
                active={faq.active}
                disableUp={index === 0}
                disableDown={index === faqs.length - 1}
              />
              <FaqFormDialog faq={faq} />
            </div>
          </div>
        ))}
        {faqs.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-muted-foreground">
            No FAQs yet. Create your first one.
          </div>
        )}
      </div>
    </div>
  )
}
