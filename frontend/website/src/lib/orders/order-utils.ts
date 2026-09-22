/**
 * Order lifecycle helpers shared by confirmation and tracking pages.
 */
import type { Order, OrderStatus, PaymentStatus } from '@/types'

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order received',
  confirmed: 'Order confirmed',
  preparing: 'Preparing your meal',
  ready: 'Ready for pickup',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Payment pending',
  verified: 'Payment verified',
  success: 'Paid',
  failed: 'Payment failed',
  cancelled: 'Payment cancelled',
  expired: 'Payment expired',
}

export function orderStatusIndex(status: OrderStatus): number {
  return ORDER_STATUS_FLOW.indexOf(status)
}

export function isCancelled(status: OrderStatus): boolean {
  return status === 'cancelled'
}

export function isDelivered(status: OrderStatus): boolean {
  return status === 'delivered'
}

export function formatOrderDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-GH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}