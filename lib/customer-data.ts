import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { bookings, customers, services, therapists } from "@/lib/db/schema"

export async function getCustomersAdmin() {
  const rows = await db.select().from(customers).orderBy(desc(customers.updatedAt))
  const history = await db.select({ booking: bookings, service: services, therapist: therapists })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(therapists, eq(bookings.therapistId, therapists.id))
    .orderBy(desc(bookings.date), desc(bookings.time))
  return rows.map((customer) => ({ ...customer, bookings: history.filter(({ booking }) => booking.customerId === customer.id) }))
}

export function getCustomerSegment(customer: { totalBookings: number; completedBookings: number }) {
  return customer.totalBookings <= 1 ? "New" : customer.completedBookings >= 5 ? "VIP" : "Returning"
}
