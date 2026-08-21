import Link from "next/link"
import { Card } from "@/components/ui/card"

const pages = [
  { name: "Homepage hero", description: "Kicker, title, subtitle, CTA, and hero image.", href: "/admin/hero" },
  { name: "About section", description: "Story, values, and supporting image.", href: "/admin/about" },
  { name: "Services", description: "Localized service names, descriptions, images, prices, and durations.", href: "/admin/services" },
  { name: "Therapists", description: "Profiles, biographies, availability, and photos.", href: "/admin/therapists" },
  { name: "FAQ", description: "Localized questions and answers.", href: "/admin/faq" },
  { name: "Promotions", description: "Seasonal offers, dates, discounts, and images.", href: "/admin/promotions" },
  { name: "Membership", description: "Plans, benefits, prices, and validity.", href: "/admin/membership" },
  { name: "Contact", description: "Phone, email, social links, address, and hours.", href: "/admin/contact" },
]

export const metadata = { title: "Pages | Admin" }

export default function PagesOverview() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Website content</p>
        <h1 className="mt-2 font-serif text-4xl text-foreground">Pages</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Choose a page or section to edit its live content. Changes are saved directly to the database and reflected on the public site.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {pages.map((page) => (
          <Link key={page.href} href={page.href} className="group">
            <Card className="h-full p-5 transition-colors group-hover:border-primary/50 group-hover:bg-muted/30">
              <h2 className="font-semibold text-foreground">{page.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{page.description}</p>
              <span className="mt-4 inline-block text-sm font-medium text-primary">Edit section →</span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
