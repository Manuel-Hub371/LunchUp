/**
 * Authored in the browser for the development build. An order is the
 * authoritative contract produced by the order service, never by the UI.
 */
import { withLatency, ApiError } from '@/lib/services/api'
import { getFoodById, getRestaurantById, DELIVERY_METHODS } from '@/lib/mock-data'
import { getDeliveryMinutes, roundPrice, uid } from '@/lib/utils'
import type {
  CartLine,
  CartSelection,
  DeliveryAddress,
  DeliveryMethod,
  Order,
  OrderItem,
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
}

/** Delivery options surfaced at checkout. */
export const deliveryMethods = DELIVERY_METHODS

function deliveryFeeFor(method: DeliveryMethod): number {
  const option = DELIVERY_METHODS.find((item) => item.id === method)
  return option?.fee ?? DELIVERY_METHODS[0].fee
}

function moduleFood(foodId: string) {
  return getFoodById(foodId)
}

function validateSelections(foodId: string, selections: CartSelection[], quantity: number) {
  const food = moduleFood(foodId)
  if (!food) throw new ApiError(`One of the items in your cart is no longer available.`, 422)
  if (food.available === false) throw new ApiError(`${food.name} is currently unavailable.`, 422)

  for (const selection of selections) {
    const group = food.customizationGroups?.find((g) => g.id === selection.groupId)
    if (!group) throw new ApiError(`${food.name}: a selected option is no longer offered.`, 422)
    for (const optionId of selection.optionIds) {
      const option = group.options.find((o) => o.id === optionId)
      if (!option || option.available === false) {
        throw new ApiError(`${food.name}: a selected option is no longer offered.`, 422)
      }
    }
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    throw new ApiError(`Invalid quantity for ${food.name}.`, 422)
  }
}

const ORDER_STORAGE_KEY = 'lunchup.orders.v1'

function readOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Order[]) : []
  } catch {
    return []
  }
}

function writeOrders(orders: Order[]): void {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders))
  } catch {
    /* storage unavailable */
  }
}

function buildTimeline(status: OrderStatus, label: string): OrderTimelineEntry[] {
  return [{ status, label, timestamp: new Date().toISOString() }]
}

export const orderService = {
  /**
   * Creates an order and recomputes every amount from authoritative data:
   * food base price, valid modifiers, quantity, delivery fee, coupon and
   * final total. Browser-provided prices are never trusted.
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    await withLatency(null)

    if (!input.lines.length) {
      throw new ApiError('Your cart is empty.', 422)
    }
    if (!input.deliveryAddress?.address?.trim()) {
      throw new ApiError('A delivery address is required.', 422)
    }
    if (!input.deliveryAddress?.phone?.trim()) {
      throw new ApiError('A delivery phone number is required.', 422)
    }

    const items: OrderItem[] = []
    let subtotal = 0

    for (const line of input.lines) {
      validateSelections(line.food.id, line.selections, line.quantity)
      const food = moduleFood(line.food.id) as NonNullable<ReturnType<typeof moduleFood>>
      const vendor = getRestaurantById(food.vendorId)
      if (!vendor || vendor.isOpen === false) {
        throw new ApiError(`${food.vendor} is not available for orders right now.`, 409)
      }

      let unitPrice = food.discount && food.discount > 0
        ? Math.round(food.price * (1 - food.discount / 100))
        : food.price

      const selectionsSummary: OrderItem['selections'] = []
      for (const selection of line.selections) {
        const group = food.customizationGroups?.find((g) => g.id === selection.groupId)
        if (!group) continue
        const optionNames: string[] = []
        let modifier = 0
        for (const optionId of selection.optionIds) {
          const option = group.options.find((o) => o.id === optionId)
          if (option) {
            optionNames.push(option.name)
            modifier += option.priceModifier
          }
        }
        if (optionNames.length) {
          selectionsSummary.push({ groupName: group.name, optionNames, priceModifier: modifier })
          unitPrice += modifier
        }
      }

      unitPrice = roundPrice(unitPrice)
      items.push({
        foodId: food.id,
        foodName: food.name,
        vendorId: food.vendorId,
        vendorName: food.vendor,
        image: food.image,
        quantity: line.quantity,
        unitPrice,
        lineTotal: roundPrice(unitPrice * line.quantity),
        selections: selectionsSummary,
        specialInstructions: line.specialInstructions,
      })
      subtotal += unitPrice * line.quantity
    }

    subtotal = roundPrice(subtotal)
    const deliveryFee = deliveryFeeFor(input.deliveryMethod)
    const discount = Math.max(0, input.couponDiscount || 0)
    const total = roundPrice(subtotal + deliveryFee - discount)

    const vendor = getRestaurantById(items[0].vendorId)
    const etaMinutes = (vendor ? getDeliveryMinutes(vendor.deliveryTime) : 30) + 5
    const eta = `${etaMinutes}-${etaMinutes + 10} min`

    const order: Order = {
      id: uid('order'),
      number: this.newOrderNumber(),
      status: 'pending',
      paymentStatus: input.paymentMethod === 'pay_on_delivery' ? 'success' : 'pending',
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      deliveryMethod: input.deliveryMethod,
      paymentMethod: input.paymentMethod,
      deliveryAddress: input.deliveryAddress,
      estimatedDeliveryTime: eta,
      createdAt: new Date().toISOString(),
      timeline: buildTimeline('pending', 'Order received'),
    }

    const orders = readOrders()
    orders.unshift(order)
    writeOrders(orders)
    return order
  },

  newOrderNumber(): string {
    return `LU-${Date.now().toString(36).toUpperCase()}`
  },

  async getById(orderId: string): Promise<Order | null> {
    await withLatency(null)
    return readOrders().find((order) => order.id === orderId || order.number === orderId) || null
  },

  async attachPayment(orderId: string, paymentId: string): Promise<Order | null> {
    await withLatency(null)
    const orders = readOrders()
    const order = orders.find((item) => item.id === orderId)
    if (!order) return null
    order.paymentId = paymentId
    writeOrders(orders)
    return order
  },

  /** Advancing an order — called by the payment service after verification. */
  async confirmOrder(orderId: string): Promise<Order | null> {
    await withLatency(null)
    const orders = readOrders()
    const order = orders.find((item) => item.id === orderId)
    if (!order) return null
    order.status = 'confirmed'
    order.paymentStatus = 'success'
    order.timeline = [
      ...order.timeline,
      { status: 'confirmed', label: 'Order confirmed', timestamp: new Date().toISOString() },
    ]
    writeOrders(orders)
    return order
  },

  async markCancelled(orderId: string): Promise<Order | null> {
    await withLatency(null)
    const orders = readOrders()
    const order = orders.find((item) => item.id === orderId)
    if (!order) return null
    order.status = 'cancelled'
    order.timeline = [
      ...order.timeline,
      { status: 'cancelled', label: 'Order cancelled', timestamp: new Date().toISOString() },
    ]
    writeOrders(orders)
    return order
  },

  /** Development-only: advances a confirmed order for tracking demos. */
  async simulateOrderProgress(orderId: string): Promise<Order | null> {
    await withLatency(null)
    const orders = readOrders()
    const order = orders.find((item) => item.id === orderId)
    if (!order) return null
    const sequence: { status: OrderStatus; label: string }[] = [
      { status: 'confirmed', label: 'Order confirmed' },
      { status: 'preparing', label: 'Preparing your meal' },
      { status: 'ready', label: 'Ready for pickup' },
      { status: 'out_for_delivery', label: 'Out for delivery' },
      { status: 'delivered', label: 'Delivered' },
    ]
    const currentIndex = sequence.findIndex((entry) => entry.status === order.status)
    const next = sequence[currentIndex + 1]
    if (next) {
      order.status = next.status
      order.timeline = [
        ...order.timeline,
        { status: next.status, label: next.label, timestamp: new Date().toISOString() },
      ]
      writeOrders(orders)
    }
    return order
  },
}