"use client"

import { useLanguage, pickLocalized } from "@/lib/i18n/language-provider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { getFaqs } from "@/lib/data"

type FaqRow = Awaited<ReturnType<typeof getFaqs>>[number]

export function Faq({ faqs }: { faqs: FaqRow[] }) {
  const { t: dict, locale } = useLanguage()
  const t = dict.faq

  return (
    <section id="faq" className="bg-header-background py-20 md:py-28">
      <div className="mx-auto max-w-[80rem] px-8 lg:px-20">
        <div>
          <p className="section-heading text-accent">{t.kicker}</p>
          <h2 className="mt-3 text-balance text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
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
                  <AccordionTrigger className="font-sans text-lg font-normal leading-relaxed text-foreground hover:no-underline [&>svg]:text-primary">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-muted-foreground">{answer}</AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>
    </section>
  )
}
