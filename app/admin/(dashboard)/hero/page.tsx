import { getHeroContentAdmin } from "@/lib/admin-data"
import { HeroForm } from "@/components/admin/hero-form"

const fallback = { kickerEn: "", kickerKo: "", kickerVi: "", titleLine1En: "", titleLine1Ko: "", titleLine1Vi: "", titleLine2En: "", titleLine2Ko: "", titleLine2Vi: "", subtitleEn: "", subtitleKo: "", subtitleVi: "", ctaEn: "", ctaKo: "", ctaVi: "", imageUrl: "/images/spa-hero.png", visible: true }

export default async function HeroAdminPage() {
  const hero = await getHeroContentAdmin()
  return <section className="flex flex-col gap-6"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Content management</p><h1 className="mt-2 font-serif text-4xl">Hero</h1><p className="mt-2 text-muted-foreground">Edit multilingual hero copy, image, CTA, and visibility.</p></div><div className="border border-border bg-card p-6"><HeroForm hero={hero ?? fallback} /></div></section>
}
