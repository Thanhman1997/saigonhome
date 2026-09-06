import { Header } from "@/components/header"

export const metadata = { title: "Terms of Service | Lotus Wellness" }

export default function TermsPage() {
  return <><Header /><main className="min-h-screen bg-background px-5 py-16 text-foreground sm:px-8"><article className="mx-auto max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Lotus Wellness</p><h1 className="mt-4 font-serif text-5xl font-light">Terms of Service</h1><p className="mt-6 leading-7 text-muted-foreground">By booking a service with Lotus Wellness, you agree to provide accurate booking information and follow the service instructions shared with you.</p><h2 className="mt-10 font-serif text-3xl">Bookings and cancellations</h2><p className="mt-4 leading-7 text-muted-foreground">Appointments are subject to availability and confirmation. Please contact us as early as possible if you need to change or cancel a booking.</p><h2 className="mt-10 font-serif text-3xl">Service use</h2><p className="mt-4 leading-7 text-muted-foreground">Our services are provided for wellness and relaxation. Please communicate relevant health information to your therapist before the appointment.</p></article></main></>
}
