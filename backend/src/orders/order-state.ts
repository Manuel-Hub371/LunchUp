import { OrderStatus, PaymentStatus, PaymentMethod, DeliveryMethod } from '@prisma/client'

/**
 * Legal order state transitions. `REFUNDED`, `CANCELLED` and `REJECTED` are
 * terminal. Every transition writes an OrderStatusHistory row, so the full
 * trail is always available and the DB remains the source of truth.
 */
export const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED', 'REJECTED'],
  PAID: ['CONFIRMED', 'CANCELLED', 'REJECTED', 'REFUNDED'],
  CONFIRMED: ['PREPARING', 'CANCELLED', 'REJECTED', 'REFUNDED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
  REFUNDED: [],
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Order received',
  PAID: 'Payment confirmed',
  CONFIRMED: 'Order confirmed',
  PREPARING: 'Preparing your meal',
  READY: 'Ready for pickup',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Order cancelled',
  REJECTED: 'Order rejected',
  REFUNDED: 'Order refunded',
}

/** Transitions a vendor may apply on its own restaurants. */
export const VENDOR_TRANSITIONS: OrderStatus[] = [
  'PAID',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'REJECTED',
]

/** The vendor confirmation step happens on PAID → CONFIRMED. */
export const VENDOR_TOKEN: Record<OrderStatus, true | undefined> = {
  PAID: true,
  CONFIRMED: true,
  PREPARING: true,
  READY: true,
  OUT_FOR_DELIVERY: true,
  DELIVERED: true,
  REJECTED: true,
  PENDING_PAYMENT: undefined,
  CANCELLED: undefined,
  REFUNDED: undefined,
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (ORDER_FLOW[from] || []).includes(to)
}

/** Maps backend status to the frontend `OrderStatus` vocabulary. */
export function frontendOrderStatus(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PENDING_PAYMENT: 'pending',
    PAID: 'confirmed',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REJECTED: 'cancelled',
    REFUNDED: 'cancelled',
  }
  return map[status]
}

export function frontendPaymentStatus(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    SUCCESS: 'success',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    REFUNDED: 'cancelled',
  }
  return map[status]
}

export type FrontendDeliveryMethod = 'standard' | 'express'
export type FrontendPaymentMethod = 'mobile_money' | 'card' | 'pay_on_delivery'

export const DELIVERY_METHODS: { id: FrontendDeliveryMethod; label: string; fee: number; eta: string; description: string }[] = [
  { id: 'standard', label: 'Standard Delivery', fee: 10, eta: '25-40 min', description: 'Reliable delivery by a LunchUp rider' },
  { id: 'express', label: 'Express Delivery', fee: 18, eta: '15-25 min', description: 'Priority dispatch straight to your door' },
]

export function parseDeliveryMethod(value: string): DeliveryMethod {
  return value === 'express' ? 'EXPRESS' : 'STANDARD'
}

export function parsePaymentMethod(value: string): PaymentMethod {
  switch (value) {
    case 'mobile_money':
      return 'MOBILE_MONEY'
    case 'card':
      return 'CARD'
    default:
      return 'PAY_ON_DELIVERY'
  }
}

export function formatDeliveryMethod(value: DeliveryMethod): FrontendDeliveryMethod {
  return value === 'EXPRESS' ? 'express' : 'standard'
}

export function formatPaymentMethod(value: PaymentMethod): FrontendPaymentMethod {
  switch (value) {
    case 'MOBILE_MONEY':
      return 'mobile_money'
    case 'CARD':
      return 'card'
    default:
      return 'pay_on_delivery'
  }
}