import { escapeHtml } from "@/lib/security"
import { getEmailSiteUrl } from "@/lib/site-url"

export type AdminBookingConfirmationDetails = {
  id: number
  reference: string
  serviceName: string
  durationMinutes: number
  date: string
  time: string
  guests: number
  customerName: string
  email: string
  phone: string
  therapistCode: string | null
  paymentMethod: string
  address: string
  detailedAddress: string
  notes: string
  subtotalVnd: number
  discountVnd: number
  discountLabel: string | null
  totalVnd: number
}

export function buildAdminBookingAmpConfirmationEmail(details: AdminBookingConfirmationDetails, token: string) {
  const actionUrl = new URL("/api/booking-confirmations/confirm", getEmailSiteUrl()).href
  const formatVnd = (amount: number) => `${new Intl.NumberFormat("vi-VN").format(amount)} VND`
  const address = [details.address, details.detailedAddress].filter(Boolean).join(" — ")
  const row = (label: string, value: string) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
  const actionForm = (action: "confirm" | "reject", label: string, className: string) => `
      <form method="post" action-xhr="${escapeHtml(actionUrl)}">
        <input type="hidden" name="bookingId" value="${details.id}">
        <input type="hidden" name="token" value="${escapeHtml(token)}">
        <input type="hidden" name="action" value="${action}">
        <button class="${className}" type="submit">${label}</button>
        <div submit-success><template type="amp-mustache"><p class="result" role="status">{{message}}</p></template></div>
        <div submit-error><template type="amp-mustache"><p class="result" role="alert">{{message}}</p></template></div>
      </form>`

  return `<!doctype html>
<html amp4email lang="en" data-css-strict>
  <head>
    <meta charset="utf-8">
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
    <script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>
    <style amp4email-boilerplate>body{visibility:hidden}</style>
    <style amp-custom>
      body{margin:0;padding:24px;background:#f4f6f4;color:#23312b;font-family:Arial,sans-serif;line-height:1.5}
      .panel{max-width:560px;margin:0 auto;padding:28px;background:#fff;border:1px solid #dce3de;border-radius:12px}
      .brand{font-size:12px;font-weight:700;letter-spacing:2px;color:#496253}
      h1{font-size:24px;line-height:1.25;margin:12px 0}
      p{margin:8px 0}
      .details{margin:20px 0;padding:16px;background:#f4f6f4;border-radius:8px}
      table{width:100%;border-collapse:collapse;font-size:14px}
      th,td{padding:7px 4px;border-bottom:1px solid #dce3de;text-align:left;vertical-align:top}
      th{width:38%;font-weight:400;color:#58655e}
      .confirm,.reject{display:block;width:100%;margin-top:12px;padding:14px 18px;border:0;border-radius:8px;font-size:16px;font-weight:700;text-align:center}
      .confirm{background:#26362f;color:#fff}
      .reject{background:#f4e8e8;color:#713838}
      .result{padding:10px;background:#f4f6f4;border-radius:6px}
      .notice{margin-top:16px;color:#58655e;font-size:13px}
      @media (max-width:480px){body{padding:12px}.panel{padding:20px}}
    </style>
  </head>
  <body>
    <div class="panel">
      <p class="brand">LOTUS WELLNESS</p>
      <h1>Booking awaiting confirmation</h1>
      <p>Booking reference: <strong>${escapeHtml(details.reference)}</strong></p>
      <div class="details">
        <table>
          ${row("Customer", details.customerName)}
          ${row("Email", details.email)}
          ${row("Phone", details.phone)}
          ${row("Service", `${details.serviceName} (${details.durationMinutes} minutes)`)}
          ${row("Appointment", `${details.date} at ${details.time} Vietnam time`)}
          ${row("Therapist", details.therapistCode ?? "No preference / to be assigned")}
          ${row("Guests", String(details.guests))}
          ${row("Payment method", details.paymentMethod)}
          ${row("Address", address)}
          ${details.notes ? row("Customer notes", details.notes) : ""}
          ${row("Subtotal", formatVnd(details.subtotalVnd))}
          ${details.discountLabel ? row("Discount", `${details.discountLabel} (-${formatVnd(details.discountVnd)})`) : ""}
          ${row("Total", formatVnd(details.totalVnd))}
        </table>
      </div>
      ${actionForm("confirm", "CONFIRM BOOKING", "confirm")}
      ${actionForm("reject", "REJECT BOOKING", "reject")}
      <p class="notice">Each button submits a one-time request. Opening the email does not change the booking. The customer is notified only after the database update succeeds.</p>
    </div>
  </body>
</html>`
}
