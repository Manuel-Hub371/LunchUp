/**
 * Order service — create and retrieve orders through the LunchUp API.
 *
 * Before an order is created the local cart is synchronized onto the server
 * cart (items/quantities/instructions reconciled, one restaurant per cart),
 * then `POST /orders` is sent and the server is authoritative for pricing,
 * availability and coupon validation.
 */
import { apiRequest, ApiError, request } from '@/lib/services/api'
import type {
  CartLine,
  DeliveryAddress,
  DeliveryMethod,
  Order,
  OrderStatus,
  OrderTimelineEntry,
  PaymentMethod,
} from '@/types'

export interface CreateOrderInput {
  lines: CartLine[]
  deliveryAddress: DeliveryAddress
  deliveryMethod: DeliveryMethod
  paymentMethod: PaymentMethod
  couponDiscount?: number
  couponLabel?: string
  couponCode?: string
}

/** Delivery options surfaced at checkout (fees mirror the backend). */
export const deliveryMethods: { id: DeliveryMethod; label: string; eta: string; fee: number; description: string }[] = [
  { id: 'standard', label: 'Standard Delivery', eta: '30–45 min', fee: 10, description: 'Doorstep delivery' },
  { id: 'express', label: 'Express Delivery', eta: '20–30 min', fee: 18, description: 'Prioritised dispatch' },
]

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
  statusRaw?: string
  paymentStatus: string
  items: OrderViewItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  couponCode?: string | null
  couponLabel?: string | null
  deliveryMethod: 'standard' | 'express'
  paymentMethod: PaymentMethod
  deliveryAddress: {
    name: string
    phone: string
    address?: string | null
    landmark?: string | null
    city: string
    instructions?: string | null
  }
  estimatedDeliveryTime?: string
  createdAt: string
  paymentId?: string
  payment?: { reference: string | null; accountMasked: string | null } | null
  timeline: { status: string; label: string; timestamp: string }[]
}

function toDeliveryAddress(address: OrderView['deliveryAddress']): DeliveryAddress {
  return {
    name: address.name,
    phone: address.phone,
    address: address.address ?? '',
    landmark: address.landmark ?? undefined,
    city: address.city,
    instructions: address.instructions ?? undefined,
  }
}

export function toOrder(view: OrderView): Order {
  return {
    id: view.id,
    number: view.number,
    status: view.status as OrderStatus,
    paymentStatus: view.paymentStatus as Order['paymentStatus'],
    items: (view.items || []).map((item) => ({
      foodId: item.foodId,
      foodName: item.foodName,
      vendorId: item.vendorId,
      vendorName: item.vendorName,
      image: item.image ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      selections: item.selections || [],
      specialInstructions: item.specialInstructions,
    })),
    subtotal: view.subtotal,
    deliveryFee: view.deliveryFee,
    discount: view.discount,
    total: view.total,
    deliveryMethod: view.deliveryMethod,
    paymentMethod: view.paymentMethod,
    deliveryAddress: toDeliveryAddress(view.deliveryAddress),
    estimatedDeliveryTime: view.estimatedDeliveryTime || '',
    createdAt: view.createdAt,
    paymentId: view.paymentId,
    paymentReference: view.payment?.reference ?? undefined,
    timeline: (view.timeline || []).map((entry) => ({
      status: entry.status as OrderStatus,
      label: entry.label,
      timestamp: entry.timestamp,
    })),
  }
}

interface CartLineView {
  key: string
  itemId: string
  food: { id: string }
  quantity: number
  selections: { groupId: string; optionIds: string[] }[]
  specialInstructions?: string
}

interface CartView {
  items: CartLineView[]
}

function selectionSignature(selections: { groupId: string; optionIds: string[] }[]): string {
  return JSON.stringify(
    [...selections]
      .sort((a, b) => a.groupId.localeCompare(b.groupId))
      .map((s) => ({ groupId: s.groupId, optionIds: [...s.optionIds].sort() }))
  )
}

function matchesCartLine(local: CartLine, server: CartLineView): boolean {
  if (local.food.id !== server.food.id) return false
  return selectionSignature(local.selections) === selectionSignature(server.selections || [])
}

/** Reconciles the local cart onto the server cart before ordering. */
async function syncCart(lines: CartLine[]): Promise<void> {
  let envelope: Awaited<ReturnType<typeof apiRequest<CartView>>>
  try {
    envelope = await apiRequest<CartView>('/cart')
  } catch (error) {
    throw wrapApiError(error, 'Please sign in before placing your order.')
  }

  const serverItems = envelope.data?.items || []
  const matchedServer = new Set<string>()

  for (const line of lines) {
    const serverItem = serverItems.find((item) => matchesCartLine(line, item))
    if (serverItem) {
      matchedServer.add(serverItem.itemId)
      try {
        await apiRequest<CartView>(`/cart/items/${encodeURIComponent(serverItem.itemId)}`, {
          method: 'PATCH',
          body: {
            quantity: line.quantity,
            specialInstructions: line.specialInstructions,
          },
        })
      } catch (error) {
        throw wrapApiError(error, 'We could not update your cart. Please try again.')
      }
    } else {
      try {
        await apiRequest<CartView>('/cart/items', {
          method: 'POST',
          body: {
            foodId: line.food.id,
            quantity: line.quantity,
            selections: line.selections.map((s) => ({ groupId: s.groupId, optionIds: s.optionIds })),
            specialInstructions: line.specialInstructions,
          },
        })
      } catch (error) {
        throw wrapApiError(error, 'We could not add all of your items. Please try again.')
      }
    }
  }

  for (const serverItem of serverItems) {
    if (matchedServer.has(serverItem.itemId)) continue
    try {
      await apiRequest<CartView>(`/cart/items/${encodeURIComponent(serverItem.itemId)}`, {
        method: 'DELETE',
      })
    } catch {
      /* best effort — a stray server line must not block ordering */
    }
  }
}

function wrapApiError(error: unknown, fallback: string): ApiError {
  if (error instanceof ApiError && error.status > 0) return error
  return new ApiError(fallback, 0, 'CART_SYNC_FAILED')
}

function buildTimeline(status: OrderStatus, label: string): OrderTimelineEntry[] {
  return [{ status, label, timestamp: new Date().toISOString() }]
}

/** Minimal order assembled from the public track endpoint. */
function orderFromTimeline(orderId: string, timeline: OrderTimelineEntry[]): Order {
  const latest = timeline[timeline.length - 1]
  return {
    id: orderId,
    number: orderId,
    status: latest?.status ?? 'pending',
    paymentStatus: 'pending',
    items: [],
    subtotal: 0,
    deliveryFee: 0,
    discount: 0,
    total: 0,
    deliveryMethod: 'standard',
    paymentMethod: 'pay_on_delivery',
    deliveryAddress: { name: '', phone: '', address: '', city: '' },
    estimatedDeliveryTime: '',
    createdAt: latest?.timestamp ?? new Date().toISOString(),
    timeline,
  }
}

export const orderService = {
  deliveryFeeFor(method: DeliveryMethod): number {
    return deliveryMethods.find((item) => item.id === method)?.fee ?? deliveryMethods[0].fee
  },

  /**
   * Creates an order. The server prices every amount from the cart; the
   * browser only supplies the delivery intent and payment preference.
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    if (!input.lines.length) {
      throw new ApiError('Your cart is empty.', 422)
    }
    if (!input.deliveryAddress?.address?.trim()) {
      throw new ApiError('A delivery address is required.', 422)
    }
    if (!input.deliveryAddress?.phone?.trim()) {
      throw new ApiError('A delivery phone number is required.', 422)
    }

    await syncCart(input.lines)

    const view = await request<OrderView>('/orders', {
      method: 'POST',
      body: {
        deliveryAddress: {
          name: input.deliveryAddress.name,
          phone: input.deliveryAddress.phone,
          address: input.deliveryAddress.address,
          landmark: input.deliveryAddress.landmark,
          city: input.deliveryAddress.city,
          instructions: input.deliveryAddress.instructions,
        },
        deliveryMethod: input.deliveryMethod,
        paymentMethod: input.paymentMethod,
        couponCode: input.couponCode,
      },
    })
    return toOrder(view)
  },

  newOrderNumber(): string {
    return `LU-${Date.now().toString(36).toUpperCase()}`
  },

  /**
   * Fetches an order by id. Prefers the authenticated detail endpoint; falls
   * back to the public track endpoint to reconstruct a minimal order.
   */
  async getById(orderId: string): Promise<Order | null> {
    if (!orderId) return null
    try {
      const view = await request<OrderView>(`/orders/${encodeURIComponent(orderId)}`)
      return toOrder(view)
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        try {
          const timeline = await request<OrderTimelineEntry[]>(
            `/orders/${encodeURIComponent(orderId)}/track`
          )
          if (!timeline?.length) return null
          return orderFromTimeline(orderId, timeline)
        } catch {
          return null
        }
      }
      return null
    }
  },

  /** Kept for compatibility — payment confirmation now refreshes from the API. */
  async attachPayment(orderId: string, _paymentId: string): Promise<Order | null> {
    return this.getById(orderId)
  },

  /** Advancing an order — the payment service refreshes status from the API. */
  async confirmOrder(orderId: string): Promise<Order | null> {
    return this.getById(orderId)
  },

  /** Customer-initiated cancellation via the API. */
  async markCancelled(orderId: string): Promise<Order | null> {
    try {
      await request<{ message: string }>(`/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST',
      })
    } catch {
      return null
    }
    return this.getById(orderId)
  },

  /** Development-only: server drives progress; this just refreshes state. */
  async simulateOrderProgress(orderId: string): Promise<Order | null> {
    return this.getById(orderId)
  },
}

export { buildTimeline }