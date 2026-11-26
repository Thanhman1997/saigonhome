export const PAYMENT_METHODS = ["BANK_TRANSFER", "CASH"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_STATUSES = ["PENDING_PAYMENT", "PAID", "PAYMENT_FAILED", "CANCELLED"] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value)
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { en: string; vi: string; ko: string }> = {
  BANK_TRANSFER: { en: "Bank transfer", vi: "Chuyển khoản ngân hàng", ko: "계좌 이체" },
  CASH: { en: "Cash", vi: "Tiền mặt", ko: "현금" },
}
