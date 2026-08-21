import { getCustomersAdmin, getCustomerSegment } from "@/lib/customer-data"
import { formatVnd } from "@/lib/pricing"

export default async function CustomersPage() {
  const customers = await getCustomersAdmin()
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Customer CRM</p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">Customer profiles</h1>
        <p className="mt-2 text-sm text-muted-foreground">Phone-first profiles with booking history, spend, and customer segments.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Segment</th><th className="px-4 py-3">Bookings</th><th className="px-4 py-3">Completed</th><th className="px-4 py-3">Total spent</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((customer) => (
                <tr key={customer.id} className="align-top">
                  <td className="px-4 py-4"><p className="font-medium text-foreground">{customer.name}</p><p className="text-xs text-muted-foreground">#{customer.id}</p></td>
                  <td className="px-4 py-4"><p>{customer.phone}</p><p className="text-xs text-muted-foreground">{customer.email}</p></td>
                  <td className="px-4 py-4"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{getCustomerSegment(customer)}</span></td>
                  <td className="px-4 py-4">{customer.totalBookings}</td><td className="px-4 py-4">{customer.completedBookings}</td><td className="px-4 py-4 font-medium">{formatVnd(customer.totalSpentVnd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!customers.length && <p className="px-4 py-12 text-center text-sm text-muted-foreground">No customer profiles yet.</p>}
      </div>
    </section>
  )
}
