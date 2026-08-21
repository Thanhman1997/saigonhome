import Image from "next/image"
import { getHeroContentAdmin } from "@/lib/admin-data"
import { Card } from "@/components/ui/card"

export const metadata = { title: "Preview | Admin" }

export default async function PreviewPage() {
  const hero = await getHeroContentAdmin()

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Protected preview</p>
          <h1 className="mt-2 font-serif text-4xl text-foreground">Homepage preview</h1>
          <p className="mt-2 text-muted-foreground">Review the latest saved hero content before sharing it publicly.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">Open public site</a>
      </div>
      <Card className="overflow-hidden p-0">
        {hero ? (
          <div className="grid gap-0 md:grid-cols-2">
            <div className="relative min-h-72 bg-muted">
              <Image src={hero.imageUrl} alt="Hero preview" fill className="object-cover" unoptimized />
            </div>
            <div className="flex flex-col justify-center gap-5 p-8 md:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{hero.kickerEn}</p>
              <h2 className="font-serif text-4xl leading-tight text-foreground">{hero.titleLine1En}<br />{hero.titleLine2En}</h2>
              <p className="leading-7 text-muted-foreground">{hero.subtitleEn}</p>
              <span className="inline-flex w-fit rounded-[var(--radius-button)] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{hero.ctaEn}</span>
              <p className="text-xs text-muted-foreground">Status: {hero.visible ? "Visible" : "Unpublished"}</p>
            </div>
          </div>
        ) : (
          <p className="p-8 text-muted-foreground">No hero content has been saved yet.</p>
        )}
      </Card>
    </section>
  )
}
