import Link from "next/link"
import { SectionStyleEditor } from "@/components/admin/section-style-editor"
import { getSectionStyles } from "@/lib/data"

export const metadata = { title: "Content & Styles | Admin" }

export default async function ContentAdminPage() {
  const styles = await getSectionStyles()

  return <section className="space-y-8">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Website editor</p>
      <h1 className="mt-2 font-serif text-4xl text-foreground">Content & Styles</h1>
      <p className="mt-2 max-w-3xl leading-6 text-muted-foreground">Choose polished fonts, sizes, colors, and alignment for each public section. Text content remains editable in the existing section editors.</p>
      <Link href="/admin/design" className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline">Edit site-wide fonts and colors</Link>
    </div>
    <SectionStyleEditor styles={styles} />
  </section>
}
