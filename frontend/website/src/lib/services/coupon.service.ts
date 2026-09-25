/**
 * Coupon service — validates promo codes against defined offers.
 *
 * Coupons are validated authoritatively by the LunchUp API at order
 * creation; this module mirrors the seeded offer catalog so checkout can
 * preview a discount before submitting the order.
 */
import type { Coupon } from '@/types'

export const coupons: Coupon[] = [
  {
    code: 'LUNCH10',
    type: 'percent',
    value: 10,
    minSubtotal: 50,
    maxDiscount: 25,
    label: '10% off orders over GH₵50',
  },
  {
    code: 'FIRST20',
    type: 'percent',
    value: 20,
    minSubtotal: 30,
    maxDiscount: 30,
    label: '20% off your first order',
  },
  {
    code: 'FREEDEL',
    type: 'fixed',
    value: 10,
    minSubtotal: 80,
    label: 'Free delivery on orders over GH₵80',
  },
]

export interface CouponApplication {
  code: string
  label: string
  discount: number
}

export type CouponLookupResult =
  | { status: 'valid'; coupon: CouponApplication }
  | { status: 'invalid' }
  | { status: 'not_eligible'; message: string }

export const couponService = {
  async validate(code: string, subtotal: number): Promise<CouponLookupResult> {
    const normalized = code.trim().toUpperCase()
    const coupon = coupons.find((item) => item.code.toUpperCase() === normalized)
    if (!coupon) return { status: 'invalid' }
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
      return {
        status: 'not_eligible',
        message: `${coupon.label} — requires a minimum order of GH₵${coupon.minSubtotal}.`,
      }
    }
    return {
      status: 'valid',
      coupon: { code: coupon.code, label: coupon.label, discount: this.discountFor(coupon, subtotal) },
    }
  },

  discountFor(coupon: Coupon, subtotal: number): number {
    const raw = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value
    if (coupon.type === 'fixed') return Math.min(raw, subtotal)
    return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw
  },

  all(): Coupon[] {
    return coupons
  },
}