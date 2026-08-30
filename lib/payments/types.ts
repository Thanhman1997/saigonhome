export type PaymentStatus = "PENDING_PAYMENT" | "PAID" | "PAYMENT_FAILED" | "CANCELLED"

export type PaymentOrder = {
  bookingId: number
  orderId: string
  amountVnd: number
  customerName: string
  customerEmail: string
  description: string
}

export type PaymentGatewayResult = {
  redirectUrl: string
  providerOrderId: string
}

export interface PaymentGateway {
  createPayment(order: PaymentOrder): Promise<PaymentGatewayResult>
  verifyWebhook(payload: string, signature: string | null): Promise<{ orderId: string; status: "PAID" | "PAYMENT_FAILED"; transactionId?: string }>
}
