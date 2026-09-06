"use client"

import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { getFaqs } from "@/lib/data"

type FaqRow = Awaited<ReturnType<typeof getFaqs>>[number]

export function Faq({ faqs }: { faqs: FaqRow[] }) {
  const { t: dict, locale } = useLanguage()
  const t = dict.faq

  return (
    <section id="faq" className="bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-[88rem] px-6 lg:px-16">
        <div>
          <p className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-bold leading-tight tracking-[-0.02em] text-primary">{t.kicker}</p>
          <h2 className="mt-3 text-balance section-heading text-foreground">
            {t.title}
          </h2>
        </div>

        {faqs.length > 0 && (
          <Accordion type="single" collapsible className="mt-10 border-t border-border/70">
            {faqs.map((faq) => {
              const question = pickLocalized({ en: faq.questionEn, ko: faq.questionKo, vi: faq.questionVi }, locale)
              const answer = pickLocalized({ en: faq.answerEn, ko: faq.answerKo, vi: faq.answerVi }, locale)
              return (
                <AccordionItem key={faq.id} value={`item-${faq.id}`} className="border-border/60 py-2">
                  <AccordionTrigger className="font-serif text-xl font-semibold text-foreground hover:no-underline [&>svg]:text-primary">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="text-lg leading-relaxed text-muted-foreground">{answer}</AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>
    </section>
  )
}
