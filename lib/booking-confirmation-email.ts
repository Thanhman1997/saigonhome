import { escapeHtml } from "@/lib/security"
import { getSiteUrl } from "@/lib/site-url"

export type AdminBookingConfirmationDetails = {
  id: number
  reference: string
  serviceName: string
  date: string
  time: string
  customerName: string
}

export function buildAdminBookingAmpConfirmationEmail(details: AdminBookingConfirmationDetails, token: string) {
  const actionUrl = new URL("/api/booking-confirmations/confirm", getSiteUrl()).href

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
      .panel{max-width:520px;margin:0 auto;padding:28px;background:#fff;border:1px solid #dce3de;border-radius:12px}
      .brand{font-size:12px;font-weight:700;letter-spacing:2px;color:#496253}
      h1{font-size:24px;line-height:1.25;margin:12px 0}
      p{margin:8px 0}
      .details{margin:20px 0;padding:16px;background:#f4f6f4;border-radius:8px}
      .confirm{display:block;width:100%;margin-top:20px;padding:14px 18px;border:0;border-radius:8px;background:#26362f;color:#fff;font-size:16px;font-weight:700;text-align:center}
      .notice{margin-top:16px;color:#58655e;font-size:13px}
      @media (max-width:480px){body{padding:12px}.panel{padding:20px}}
    </style>
  </head>
  <body>
    <div class="panel">
      <p class="brand">LOTUS WELLNESS</p>
      <h1>Booking awaiting confirmation</h1>
      <p>Reference: <strong>${escapeHtml(details.reference)}</strong></p>
      <div class="details">
        <p><strong>${escapeHtml(details.serviceName)}</strong></p>
        <p>${escapeHtml(details.date)} at ${escapeHtml(details.time)}</p>
        <p>Customer: ${escapeHtml(details.customerName)}</p>
      </div>
      <form method="post" action-xhr="${escapeHtml(actionUrl)}">
        <input type="hidden" name="bookingId" value="${details.id}">
        <input type="hidden" name="token" value="${escapeHtml(token)}">
        <button class="confirm" type="submit">CONFIRM BOOKING</button>
        <div submit-success>
          <template type="amp-mustache"><p role="status">{{message}}</p></template>
        </div>
        <div submit-error>
          <template type="amp-mustache"><p role="alert">{{message}}</p></template>
        </div>
      </form>
      <p class="notice">This action confirms the booking and sends a notification to the customer.</p>
    </div>
  </body>
</html>`
}
