import { Injectable } from '@nestjs/common'
import { CartItem } from '@prisma/client'
import { ApiException } from '../common/api-exception'
import { PrismaService } from '../prisma/prisma.service'
import { FoodsService } from '../foods/foods.service'
import { RestaurantsService } from '../restaurants/restaurants.service'
import { FoodWithRelations, toFoodView } from '../catalog/serializers'
import { AddCartItemDto, UpdateCartItemDto } from './dto'

const FOOD_INCLUDE = {
  restaurant: { select: { name: true, location: true, deliveryTimeMin: true } },
  category: { select: { name: true } },
  customizationGroups: {
    include: { options: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  },
} as const

export interface CartLineView {
  key: string
  itemId: string
  food: ReturnType<typeof toFoodView>
  quantity: number
  selections: { groupId: string; optionIds: string[] }[]
  specialInstructions?: string
  unitPrice: number
  lineTotal: number
}

export interface CartView {
  restaurant: { id: string; name: string; logo: string | null } | null
  items: CartLineView[]
  totals: { subtotal: number; deliveryFee: number; discount: number; total: number }
  hasItems: boolean
}

const MAX_PER_LINE = 50

function selectionsKey(selections: { groupId: string; optionIds: string[] }[]): string {
  return JSON.stringify(
    [...selections]
      .sort((a, b) => a.groupId.localeCompare(b.groupId))
      .map((s) => ({ groupId: s.groupId, optionIds: [...s.optionIds].sort() }))
  )
}

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly foods: FoodsService,
    private readonly restaurants: RestaurantsService
  ) {}

  private async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })
  }

  private async computeUnitPrice(food: FoodWithRelations, selections: { groupId: string; optionIds: string[] }[]): Promise<number> {
    let unit =
      food.discount && food.discount > 0
        ? Math.round(food.price * (1 - food.discount / 100) * 100) / 100
        : food.price
    const groups = food.customizationGroups || []
    for (const selection of selections) {
      const group = groups.find((g) => g.id === selection.groupId)
      if (!group) continue
      for (const optionId of selection.optionIds) {
        const option = group.options.find((o) => o.id === optionId)
        if (option && option.available !== false) unit += option.priceModifier
      }
    }
    return Math.round(unit * 100) / 100
  }

  /**
   * Ensures every required group has at least `minSelections` selected,
   * auto-picking the default option (or the first available one) so a plain
   * "add to cart" never produces an order that fails validation.
   */
  private normalizeSelections(
    food: FoodWithRelations,
    incoming: { groupId: string; optionIds: string[] }[]
  ): { groupId: string; optionIds: string[] }[] {
    const groups = food.customizationGroups || []
    const selections = incoming.map((s) => ({ groupId: s.groupId, optionIds: [...s.optionIds] }))
    for (const group of groups) {
      if (!group.required || group.minSelections < 1) continue
      let line = selections.find((s) => s.groupId === group.id)
      if (!line) {
        line = { groupId: group.id, optionIds: [] }
        selections.push(line)
      }
      while (line.optionIds.length < group.minSelections) {
        const pick =
          group.options.find((o) => o.isDefault && !line.optionIds.includes(o.id)) ||
          group.options.find((o) => o.available !== false && !line.optionIds.includes(o.id)) ||
          group.options.find((o) => !line.optionIds.includes(o.id))
        if (!pick) break
        line.optionIds.push(pick.id)
      }
    }
    return selections
  }

  async getCart(userId: string): Promise<CartView> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    })
    if (!cart || cart.items.length === 0) {
      return { restaurant: null, items: [], totals: { subtotal: 0, deliveryFee: 0, discount: 0, total: 0 }, hasItems: false }
    }

    let restaurant: { id: string; name: string; logoUrl: string | null } | null = null
    if (cart.restaurantId) {
      restaurant = await this.prisma.restaurant.findUnique({
        where: { id: cart.restaurantId },
        select: { id: true, name: true, logoUrl: true },
      })
    }

    const lines: CartLineView[] = []
    for (const item of cart.items) {
      const food = await this.prisma.food.findFirst({
        where: { id: item.foodId },
        include: FOOD_INCLUDE,
      })
      if (!food) continue
      const selections = (item.selections as { groupId: string; optionIds: string[] }[]) || []
      const unitPrice = await this.computeUnitPrice(food as FoodWithRelations, selections)
      lines.push({
        key: this.lineKey(item),
        itemId: item.id,
        food: toFoodView(food as FoodWithRelations),
        quantity: item.quantity,
        selections,
        specialInstructions: item.specialInstructions ?? undefined,
        unitPrice,
        lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
      })
    }

    const subtotal = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100
    return {
      restaurant: restaurant && cart.restaurantId
        ? { id: restaurant.id, name: restaurant.name, logo: restaurant.logoUrl }
        : null,
      items: lines,
      totals: {
        subtotal,
        deliveryFee: this.deliveryFeeFor('standard'),
        discount: 0,
        total: Math.round((subtotal + this.deliveryFeeFor('standard')) * 100) / 100,
      },
      hasItems: lines.length > 0,
    }
  }

  lineKey(item: CartItem): string {
    const selections = (item.selections as { groupId: string; optionIds: string[] }[]) || []
    return `${item.foodId}::${selectionsKey(selections)}`
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const food = (await this.foods.ensureAvailable(dto.foodId, dto.quantity)) as FoodWithRelations
    const restaurantId = food.restaurantId
    await this.restaurants.ensureOrderable(restaurantId)

    const cart = await this.getOrCreateCart(userId)

    // One active restaurant per cart.
    if (cart.restaurantId && cart.restaurantId !== restaurantId) {
      const current = await this.prisma.restaurant.findUnique({ where: { id: cart.restaurantId } })
      throw ApiException.conflict(
        'CART_CONFLICT',
        `Your cart contains items from ${current?.name ?? 'another restaurant'}. Start a new cart to order from this restaurant.`
      )
    }

    const selections = this.normalizeSelections(
      food as FoodWithRelations,
      (dto.selections || []).map((s) => ({ groupId: s.groupId, optionIds: s.optionIds }))
    )
    const existing = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id, foodId: dto.foodId },
    })
    const match = existing.find((item) => this.lineKey(item) === `${dto.foodId}::${selectionsKey(selections)}`)

    if (match) {
      const nextQty = match.quantity + dto.quantity
      if (nextQty > MAX_PER_LINE) throw ApiException.validation('Maximum quantity per item is 50.')
      await this.prisma.cartItem.update({
        where: { id: match.id },
        data: { quantity: nextQty },
      })
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          foodId: dto.foodId,
          quantity: dto.quantity,
          selections: selections as never,
          specialInstructions: dto.specialInstructions,
        },
      })
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { restaurantId },
      })
    }

    return this.getCart(userId)
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId)
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } })
    if (!item) throw ApiException.notFound('NOT_FOUND', 'Cart item not found.')

    const data: Record<string, unknown> = {}
    if (dto.quantity !== undefined) {
      if (dto.quantity > MAX_PER_LINE) throw ApiException.validation('Maximum quantity per item is 50.')
      data.quantity = dto.quantity
    }
    if (dto.selections) {
      if (!item.selections) {
        const food = await this.foods.ensureAvailable(item.foodId, item.quantity)
        data.selections = this.normalizeSelections(
          food as FoodWithRelations,
          dto.selections.map((s) => ({ groupId: s.groupId, optionIds: s.optionIds }))
        ) as never
      } else {
        data.selections = dto.selections.map((s) => ({ groupId: s.groupId, optionIds: s.optionIds })) as never
      }
    }
    if (dto.specialInstructions !== undefined) data.specialInstructions = dto.specialInstructions

    if (Object.keys(data).length > 0) {
      await this.prisma.cartItem.update({ where: { id: item.id }, data: data as never })
    }
    return this.getCart(userId)
  }

  async removeItem(userId: string, itemId: string): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId)
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } })
    if (item) {
      await this.prisma.cartItem.delete({ where: { id: item.id } })
    }
    const remaining = await this.prisma.cartItem.count({ where: { cartId: cart.id } })
    if (remaining === 0) {
      await this.prisma.cart.update({ where: { id: cart.id }, data: { restaurantId: null } })
    }
    return this.getCart(userId)
  }

  async clear(userId: string): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId)
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    await this.prisma.cart.update({ where: { id: cart.id }, data: { restaurantId: null } })
    return this.getCart(userId)
  }

  async validateForCheckout(userId: string): Promise<{ cartId: string; restaurantId: string }> {
    const view = await this.getCart(userId)
    if (!view.hasItems || !view.items.length) {
      throw ApiException.unprocessable('EMPTY_CART', 'Your cart is empty.')
    }
    const restaurantId = view.restaurant?.id
    if (!restaurantId) {
      throw ApiException.unprocessable('EMPTY_CART', 'Your cart has no restaurant selected.')
    }
    return { cartId: (await this.getOrCreateCart(userId)).id, restaurantId }
  }

  deliveryFeeFor(method: 'standard' | 'express'): number {
    return method === 'express' ? 18 : 10
  }
}