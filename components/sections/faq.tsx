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
      <div className="mx-auto max-w-3xl px-6">
        <div>
          <p className="text-xl font-bold uppercase tracking-widest text-primary">{t.kicker}</p>
          <h2 className="mt-3 text-balance font-sans text-7xl font-bold leading-tight tracking-tight text-foreground md:text-8xl">
            {t.title}
          </h2>
        </div>

        {faqs.length > 0 && (
          <Accordion type="single" collapsible className="mt-10 border-t border-border">
            {faqs.map((faq) => {
              const question = pickLocalized({ en: faq.questionEn, ko: faq.questionKo, vi: faq.questionVi }, locale)
              const answer = pickLocalized({ en: faq.answerEn, ko: faq.answerKo, vi: faq.answerVi }, locale)
              return (
                <AccordionItem key={faq.id} value={`item-${faq.id}`} className="border-border">
                  <AccordionTrigger className="font-serif text-lg text-foreground hover:no-underline [&>svg]:text-primary">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">{answer}</AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>
    </section>
  )
}
