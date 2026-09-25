import { Order, OrderItem, OrderStatusHistory, Payment } from '@prisma/client'
import {
  formatDeliveryMethod,
  formatPaymentMethod,
  frontendOrderStatus,
  frontendPaymentStatus,
} from './order-state'

export interface OrderViewItem {
  foodId: string
  foodName: string
  vendorId: string
  vendorName: string
  image: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
  selections: { groupName: string; optionNames: string[]; priceModifier: number }[]
  specialInstructions?: string
}

export interface OrderView {
  id: string
  number: string
  status: string
  statusRaw: string
  paymentStatus: string
  items: OrderViewItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  couponCode: string | null
  couponLabel: string | null
  deliveryMethod: 'standard' | 'express'
  paymentMethod: 'mobile_money' | 'card' | 'pay_on_delivery'
  deliveryAddress: {
    id?: string | null
    address?: string | null
    addressId?: string | null
    name: string
    phone: string
    deliverTo?: string
    line1?: string
    landmark: string | null
    city: string
    instructions: string | null
  }
  estimatedDeliveryTime: string
  createdAt: string
  paymentId?: string
  payment: { reference: string | null; accountMasked: string | null } | null
  timeline: { status: string; label: string; timestamp: string }[]
}

export interface OrderRow extends Order {
  items?: OrderItem[]
  payments?: Payment[]
  statusHistory?: OrderStatusHistory[]
}

export function toOrderView(order: OrderRow): OrderView {
  const deliveryMinutes = order.estimatedDeliveryMinutes
  return {
    id: order.id,
    number: order.number,
    status: frontendOrderStatus(order.status),
    statusRaw: order.status,
    paymentStatus: frontendPaymentStatus(order.paymentStatus),
    items: (order.items || []).map((item) => ({
      foodId: item.foodId ?? '',
      foodName: item.foodName,
      vendorId: item.restaurantId,
      vendorName: item.vendorName,
      image: item.image,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      selections: (item.selections as { groupName: string; optionNames: string[]; priceModifier: number }[]) || [],
      specialInstructions: item.specialInstructions ?? undefined,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    discount: order.discount,
    total: order.total,
    couponCode: order.couponCode,
    couponLabel: order.couponLabel,
    deliveryMethod: formatDeliveryMethod(order.deliveryMethod),
    paymentMethod: formatPaymentMethod(order.paymentMethod),
    deliveryAddress: {
      name: order.deliveryName,
      phone: order.deliveryPhone,
      address: order.deliveryLine1,
      landmark: order.deliveryLandmark,
      city: order.deliveryCity,
      instructions: order.deliveryInstructions,
    },
    estimatedDeliveryTime: `${deliveryMinutes}-${deliveryMinutes + 10} min`,
    createdAt: order.createdAt.toISOString(),
    paymentId: order.payments?.[0]?.id,
    payment: order.payments?.[0]
      ? { reference: order.payments[0].reference, accountMasked: order.payments[0].accountMasked }
      : null,
    timeline: (order.statusHistory || [])
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((entry: OrderStatusHistory) => ({
        status: frontendOrderStatus(entry.toStatus),
        label: entry.label,
        timestamp: entry.createdAt.toISOString(),
      })),
  }
}

export function toOrderListSummary(order: OrderRow) {
  const view = toOrderView(order)
  return {
    ...view,
    itemCount: (order.items || []).reduce((sum, i) => sum + i.quantity, 0),
    vendorName: order.items?.[0]?.vendorName ?? '',
    vendorId: order.items?.[0]?.restaurantId ?? '',
  }
}

export function newOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase()
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `LU-${stamp}${suffix}`
}