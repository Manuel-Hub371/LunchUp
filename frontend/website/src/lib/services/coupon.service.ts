/**
 * Coupon service — validates promo codes against defined offers.
 */
import { withLatency } from './api'
import { coupons } from '@/lib/mock-data'
import type { Coupon } from '@/types'

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
    await withLatency(null)
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
      coupon: { code, label: coupon.label, discount: this.discountFor(coupon, subtotal) },
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