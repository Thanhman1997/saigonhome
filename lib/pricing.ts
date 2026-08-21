export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ"
}

export type DiscountRates = {
  groupDiscount2: number
  groupDiscount3: number
  groupDiscount4: number
  firstTimeDiscount: number
}

export const DEFAULT_DISCOUNT_RATES: DiscountRates = {
  groupDiscount2: 0.02,
  groupDiscount3: 0.03,
  groupDiscount4: 0.05,
  firstTimeDiscount: 0.05,
}

/**
 * Group/combo discount, applied automatically based on party size.
 * Rates are admin-configurable via Booking Settings; falls back to defaults.
 */
export function getGroupDiscountRate(guests: number, rates: DiscountRates = DEFAULT_DISCOUNT_RATES): number {
  if (guests >= 4) return rates.groupDiscount4
  if (guests === 3) return rates.groupDiscount3
  if (guests === 2) return rates.groupDiscount2
  return 0
}

export function getGroupDiscountLabel(guests: number, rates: DiscountRates = DEFAULT_DISCOUNT_RATES): string | null {
  const rate = getGroupDiscountRate(guests, rates)
  if (rate === 0) return null
  return `Group discount (${guests} people): ${Math.round(rate * 100)}% off`
}

export const FIRST_TIME_DISCOUNT_RATE = DEFAULT_DISCOUNT_RATES.firstTimeDiscount
