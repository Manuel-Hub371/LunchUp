import { Injectable } from '@nestjs/common'
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client'
import { ApiException } from '../common/api-exception'
import { paginate } from '../common/pagination'
import { PaginatedResult } from '../common/response.interceptor'
import { PrismaService } from '../prisma/prisma.service'
import { CartService } from '../cart/cart.service'
import { EventsService } from '../realtime/events.service'
import { computeSelection, roundPrice } from './pricing'
import { newOrderNumber, OrderRow, toOrderListSummary, toOrderView } from './order-views'
import {
  canTransition,
  STATUS_LABELS,
  VENDOR_TOKEN,
  VENDOR_TRANSITIONS,
  frontendOrderStatus,
  parseDeliveryMethod,
  parsePaymentMethod,
} from './order-state'
import { CreateOrderDto, UpdateOrderStatusDto, AdminUpdateOrderStatusDto } from './dto'

const ORDER_INCLUDE = {
  items: true,
  payments: true,
  statusHistory: true,
} as const

const FOOD_INCLUDE = {
  customizationGroups: {
    include: { options: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  },
  restaurant: { select: { name: true, deliveryTimeMin: true } },
} as const

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
    private readonly events: EventsService
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const { cartId, restaurantId } = await this.cart.validateForCheckout(userId)

    const cartItems = await this.prisma.cartItem.findMany({
      where: { cartId },
      include: { food: { include: FOOD_INCLUDE } },
      orderBy: { createdAt: 'asc' },
    })
    if (cartItems.length === 0) {
      throw ApiException.unprocessable('EMPTY_CART', 'Your cart is empty.')
    }

    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, deletedAt: null } })
    if (!restaurant) throw ApiException.notFound('RESTAURANT_NOT_FOUND', 'Restaurant not found.')
    if (restaurant.status !== 'APPROVED' || restaurant.isOpen === false) {
      throw ApiException.conflict('RESTAURANT_CLOSED', `${restaurant.name} is not available for orders right now.`)
    }

    const orderItems: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = []
    let subtotal = 0
    for (const cartItem of cartItems) {
      const food = cartItem.food as (typeof cartItem.food) & {
        customizationGroups?: {
          id: string
          name: string
          required: boolean
          minSelections: number
          maxSelections: number
          options: { id: string; name: string; priceModifier: number; available: boolean }[]
        }[]
        restaurant?: { name: string; deliveryTimeMin: number } | null
      }
      if (!food || food.deletedAt) {
        throw ApiException.unprocessable('FOOD_UNAVAILABLE', 'One of the items in your cart is no longer available.')
      }
      if (food.available === false) {
        throw ApiException.unprocessable('FOOD_UNAVAILABLE', `${food.name} is currently unavailable.`)
      }
      if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1 || cartItem.quantity > 50) {
        throw ApiException.validation(`Invalid quantity for ${food.name}.`)
      }

      const selections = (cartItem.selections as { groupId: string; optionIds: string[] }[]) || []
      const { unitPrice, summaries } = computeSelection(food, selections)
      const lineTotal = roundPrice(unitPrice * cartItem.quantity)

      orderItems.push({
        foodId: food.id,
        foodName: food.name,
        restaurantId: food.restaurantId,
        vendorName: food.restaurant?.name ?? '',
        image: food.image,
        quantity: cartItem.quantity,
        unitPrice,
        lineTotal,
        selections: summaries as never,
        specialInstructions: cartItem.specialInstructions,
      })
      subtotal += lineTotal
    }
    subtotal = roundPrice(subtotal)

    const deliveryFee = this.cart.deliveryFeeFor(dto.deliveryMethod)

    const coupon = dto.couponCode ? await this.resolveCoupon(dto.couponCode, subtotal) : null
    const discount = Math.min(coupon?.discount ?? 0, subtotal)
    const total = roundPrice(subtotal + deliveryFee - discount)

    const address = await this.resolveAddress(userId, dto)
    const estimatedMinutes = (restaurant.deliveryTimeMin ?? 30) + 5

    const paymentMethod = parsePaymentMethod(dto.paymentMethod)
    const isPayOnDelivery = paymentMethod === 'PAY_ON_DELIVERY'
    const initialStatus: OrderStatus = isPayOnDelivery ? 'CONFIRMED' : 'PENDING_PAYMENT'
    const initialPaymentStatus: PaymentStatus = isPayOnDelivery ? 'SUCCESS' : 'PENDING'

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          number: newOrderNumber(),
          userId,
          restaurantId,
          status: initialStatus,
          paymentStatus: initialPaymentStatus,
          subtotal,
          deliveryFee,
          discount,
          total,
          couponCode: dto.couponCode?.toUpperCase() ?? null,
          couponLabel: coupon?.label ?? null,
          deliveryMethod: parseDeliveryMethod(dto.deliveryMethod),
          paymentMethod,
          deliveryName: address.name,
          deliveryPhone: address.phone,
          deliveryLine1: address.line1,
          deliveryLandmark: address.landmark ?? null,
          deliveryCity: address.city,
          deliveryInstructions: address.instructions ?? null,
          estimatedDeliveryMinutes: estimatedMinutes,
          customerNote: dto.note ?? null,
          items: { create: orderItems },
          payments: isPayOnDelivery
            ? {
                create: {
                  method: paymentMethod,
                  amount: total,
                  status: initialPaymentStatus,
                  collectedOnDelivery: true,
                  provider: 'pay_on_delivery',
                },
              }
            : undefined,
          statusHistory: {
            create: { toStatus: initialStatus, label: STATUS_LABELS[initialStatus] },
          },
        },
        include: ORDER_INCLUDE,
      })

      if (coupon) {
        await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } })
      }

      await tx.cartItem.deleteMany({ where: { cartId } })
      await tx.cart.update({ where: { id: cartId }, data: { restaurantId: null } })

      return created
    })

    const view = toOrderView(order as OrderRow)
    await this.events.notify(userId, {
      type: 'ORDER_UPDATE',
      title: `Order ${view.number} placed`,
      body: `Your order is ${isPayOnDelivery ? 'confirmed' : 'awaiting payment'}.`,
      data: { orderId: order.id },
    })
    this.events.emitToOrder(order.id, 'order:updated', {
      orderId: order.id,
      number: order.number,
      status: view.status,
      paymentStatus: view.paymentStatus,
      timestamp: new Date().toISOString(),
    })

    return view
  }

  async listForCustomer(
    userId: string,
    query: { page?: number; pageSize?: number; status?: string }
  ): Promise<PaginatedResult<ReturnType<typeof toOrderListSummary>>> {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 10))

    const where: Prisma.OrderWhereInput = {
      userId,
      ...(query.status ? { status: query.status as OrderStatus } : {}),
    }
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ])
    return paginate(orders.map((o) => toOrderListSummary(o as OrderRow)), total, page, pageSize)
  }

  async getOrderForActor(userId: string, role: string, orderId: string) {
    const order = await this.loadOrder(orderId)
    if (role === 'ADMIN') return toOrderView(order)
    if (order.userId === userId) return toOrderView(order)
    if (role === 'VENDOR') {
      const vendorProfile = await this.prisma.vendorProfile.findUnique({ where: { userId } })
      if (vendorProfile && order.restaurantId) {
        const owned = await this.prisma.restaurant.findFirst({
          where: { id: order.restaurantId, vendorProfileId: vendorProfile.id },
        })
        if (owned) return toOrderView(order)
      }
    }
    throw ApiException.forbidden()
  }

  async track(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { statusHistory: { orderBy: { createdAt: 'asc' } } },
    })
    if (!order) throw ApiException.notFound('NOT_FOUND', 'Order not found.')
    return (order.statusHistory || []).map((entry) => ({
      status: frontendOrderStatus(entry.toStatus),
      label: entry.label,
      timestamp: entry.createdAt.toISOString(),
    }))
  }

  async cancel(userId: string, orderId: string) {
    const order = await this.loadOrder(orderId)
    if (order.userId !== userId) throw ApiException.forbidden()
    if (['DELIVERED', 'CANCELLED', 'REJECTED', 'REFUNDED'].includes(order.status)) {
      throw ApiException.conflict('INVALID_TRANSITION', 'This order can no longer be cancelled.')
    }
    if (!canTransition(order.status, 'CANCELLED') && !canTransition(order.status, 'REFUNDED')) {
      throw ApiException.conflict('INVALID_TRANSITION', 'This order cannot be cancelled at its current stage.')
    }
    return this.applyTransition({
      orderId,
      toStatus: order.paymentStatus === 'SUCCESS' ? 'REFUNDED' : 'CANCELLED',
      note: 'Cancelled by customer',
    })
  }

  async vendorList(userId: string, query: { page?: number; pageSize?: number; status?: string; restaurantId?: string }) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } })
    if (!profile) throw ApiException.forbidden('Complete vendor onboarding to access this area.')

    const ownedRestaurantIds = (
      await this.prisma.restaurant.findMany({
        where: { vendorProfileId: profile.id },
        select: { id: true },
      })
    ).map((r) => r.id)

    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 10))
    const where: Prisma.OrderWhereInput = {
      restaurantId: query.restaurantId ? query.restaurantId : { in: ownedRestaurantIds },
      ...(query.status ? { status: query.status as OrderStatus } : {}),
    }
    if (query.restaurantId && !ownedRestaurantIds.includes(query.restaurantId)) {
      throw ApiException.forbidden()
    }
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ])
    return paginate(orders.map((o) => toOrderListSummary(o as OrderRow)), total, page, pageSize)
  }

  async vendorStatus(userId: string, orderId: string, dto: UpdateOrderStatusDto) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } })
    if (!profile) throw ApiException.forbidden('Complete vendor onboarding to access this area.')
    const order = await this.loadOrder(orderId)
    const owned = await this.prisma.restaurant.findFirst({
      where: { id: order.restaurantId, vendorProfileId: profile.id },
    })
    if (!owned) throw ApiException.forbidden()

    const toStatus = dto.status as OrderStatus
    if (!VENDOR_TRANSITIONS.includes(toStatus)) {
      throw ApiException.conflict('INVALID_TRANSITION', 'This status change is not allowed.')
    }
    if (!canTransition(order.status, toStatus)) {
      throw ApiException.conflict(
        'INVALID_TRANSITION',
        `Cannot move an order from ${order.status} to ${toStatus}.`
      )
    }
    return this.applyTransition({ orderId, toStatus, note: dto.note })
  }

  async adminStatus(orderId: string, dto: AdminUpdateOrderStatusDto) {
    const order = await this.loadOrder(orderId)
    const toStatus = dto.status as OrderStatus
    if (!canTransition(order.status, toStatus) && order.status !== toStatus) {
      throw ApiException.conflict(
        'INVALID_TRANSITION',
        `Cannot move an order from ${order.status} to ${toStatus}.`
      )
    }
    if (order.status === toStatus) return toOrderView(order)
    return this.applyTransition({ orderId, toStatus, note: dto.note ?? 'Admin override' })
  }

  async adminList(query: { page?: number; pageSize?: number; status?: string; search?: string }) {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20))
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status as OrderStatus } : {}),
      ...(query.search
        ? { OR: [{ number: { contains: query.search, mode: 'insensitive' } }, { id: query.search }] }
        : {}),
    }
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ])
    return paginate(orders.map((o) => toOrderListSummary(o as OrderRow)), total, page, pageSize)
  }

  private async loadOrder(orderId: string): Promise<OrderRow> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    })
    if (!order) throw ApiException.notFound('NOT_FOUND', 'Order not found.')
    return order as OrderRow
  }

  private async applyTransition(params: {
    orderId: string
    toStatus: OrderStatus
    note?: string
    markPayment?: PaymentStatus
  }) {
    const order = await this.loadOrder(params.orderId)
    const fromStatus = order.status

    const updated = await this.prisma.$transaction(async (tx) => {
      const historyCreate = {
        fromStatus,
        toStatus: params.toStatus,
        label: STATUS_LABELS[params.toStatus],
        note: params.note ?? null,
      }
      const result = await tx.order.update({
        where: { id: order.id },
        data: {
          status: params.toStatus,
          ...(params.markPayment ? { paymentStatus: params.markPayment } : {}),
          ...(params.toStatus === 'REFUNDED' ? { paymentStatus: 'REFUNDED' } : {}),
          statusHistory: { create: historyCreate },
        },
        include: ORDER_INCLUDE,
      })
      return result
    })

    const view = toOrderView(updated as OrderRow)
    this.events.emitToOrder(order.id, 'order:updated', {
      orderId: order.id,
      number: order.number,
      status: view.status,
      paymentStatus: view.paymentStatus,
      timestamp: new Date().toISOString(),
    })
    await this.events.notify(order.userId, {
      type: 'ORDER_UPDATE',
      title: `Order ${order.number} ${view.status === 'cancelled' ? 'cancelled' : 'updated'}`,
      body: STATUS_LABELS[params.toStatus],
      data: { orderId: order.id, status: view.status },
    })
    return view
  }

  private async resolveCoupon(code: string, subtotal: number) {
    const normalized = code.trim().toUpperCase()
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: { equals: normalized, mode: 'insensitive' } },
    })
    if (!coupon) throw ApiException.validation('This coupon code is not valid.')
    if (!coupon.isActive) throw ApiException.validation('This coupon code is no longer active.')
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw ApiException.validation('This coupon code has expired.')
    }
    if (coupon.startsAt && coupon.startsAt > new Date()) {
      throw ApiException.validation('This coupon code is not active yet.')
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw ApiException.validation('This coupon code has reached its usage limit.')
    }
    if (subtotal < coupon.minSubtotal) {
      throw ApiException.validation(`This coupon requires a minimum subtotal of GH₵${coupon.minSubtotal}.`)
    }

    let discount: number
    if (coupon.type === 'PERCENT') {
      discount = roundPrice((subtotal * coupon.value) / 100)
      if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount
      }
    } else {
      discount = Math.min(coupon.value, subtotal)
    }
    return { id: coupon.id, discount, label: coupon.label ?? coupon.code }
  }

  private async resolveAddress(userId: string, dto: CreateOrderDto) {
    if (dto.addressId) {
      const address = await this.prisma.address.findFirst({ where: { id: dto.addressId, userId } })
      if (!address) throw ApiException.notFound('NOT_FOUND', 'Address not found.')
      return {
        name: address.name,
        phone: address.phone,
        line1: address.line1,
        landmark: address.landmark,
        city: address.city,
        instructions: address.instructions,
      }
    }
    const addr = dto.deliveryAddress
    if (!addr) throw ApiException.validation('Provide a delivery address.')
    if (!addr.address?.trim()) throw ApiException.validation('A delivery address is required.')
    if (!addr.phone?.trim()) throw ApiException.validation('A delivery phone number is required.')
    return {
      name: addr.name,
      phone: addr.phone,
      line1: addr.address,
      landmark: addr.landmark ?? null,
      city: addr.city,
      instructions: addr.instructions ?? null,
    }
  }

  /** Public helper used by the payments module. */
  async markPaid(orderId: string, note?: string) {
    const order = await this.loadOrder(orderId)
    if (order.status === 'PENDING_PAYMENT') {
      return this.applyTransition({
        orderId,
        toStatus: 'PAID',
        note: note ?? 'Payment verified',
        markPayment: 'SUCCESS',
      })
    }
    return toOrderView(order)
  }
}