import { getContactInfoAdmin } from "@/lib/admin-data"
import { ContactForm } from "@/components/admin/contact-form"

export const metadata = { title: "Contact" }

export default async function AdminContactPage() {
  const contact = await getContactInfoAdmin()

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Contact Info</h1>
        <p className="text-sm text-muted-foreground">
          Update the phone number, email, chat links, and hours shown on the public site.
        </p>
      </div>
      <ContactForm contact={contact} />
    </div>
  )
}
