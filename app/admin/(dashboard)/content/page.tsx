import { SectionStyleEditor } from "@/components/admin/section-style-editor"

export const metadata = { title: "Content & Styles | Admin" }

export default function ContentAdminPage() {
  return <section className="space-y-8">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Website editor</p>
      <h1 className="mt-2 font-serif text-4xl text-foreground">Content & Styles</h1>
      <p className="mt-2 max-w-3xl leading-6 text-muted-foreground">Manage visual styles for every public section. Use CSS font values such as 1.25rem, hex colors, and left, center, or right alignment. Text content remains editable in the existing section editors.</p>
    </div>
    <SectionStyleEditor />
  </section>
}
