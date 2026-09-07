import { SectionStyleEditor } from "@/components/admin/section-style-editor"
import { getSectionStyles } from "@/lib/data"

export const metadata = { title: "Content & Styles | Admin" }

export default async function ContentAdminPage() {
  const sectionStyles = await getSectionStyles()
  return <section className="space-y-8">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Website editor</p>
      <h1 className="mt-2 font-serif text-4xl text-foreground">Content & Styles</h1>
      <p className="mt-2 max-w-3xl leading-6 text-muted-foreground">Choose a typeface for each section&apos;s heading and body text, set sizes and colors, and align them left, center, or right. Text content remains editable in the existing section editors.</p>
    </div>
    <SectionStyleEditor initialStyles={sectionStyles} />
  </section>
}
