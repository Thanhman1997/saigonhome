import { Header } from "@/components/header"

export const metadata = { title: "Privacy Policy | Lotus Wellness" }

export default function PrivacyPage() {
  return <><Header /><main className="min-h-screen bg-background px-5 py-16 text-foreground sm:px-8"><article className="mx-auto max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Lotus Wellness</p><h1 className="mt-4 font-serif text-5xl font-light">Privacy Policy</h1><p className="mt-6 leading-7 text-muted-foreground">We collect only the information needed to provide bookings, respond to enquiries, and improve our services. We do not sell personal information.</p><h2 className="mt-10 font-serif text-3xl">Information we use</h2><p className="mt-4 leading-7 text-muted-foreground">Booking details and contact information are used to confirm appointments and provide customer support. You may contact us to request access, correction, or deletion of your information.</p><h2 className="mt-10 font-serif text-3xl">Contact</h2><p className="mt-4 leading-7 text-muted-foreground">For privacy questions, please use the contact options on our website.</p></article></main></>
}
