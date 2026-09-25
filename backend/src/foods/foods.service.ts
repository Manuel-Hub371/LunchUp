import { Injectable } from '@nestjs/common'
import { ApiException } from '../common/api-exception'
import { PaginatedResult } from '../common/response.interceptor'
import { PrismaService } from '../prisma/prisma.service'
import { FoodWithRelations, toFoodView } from '../catalog/serializers'
import { FoodQueryDto, PricePreviewDto } from './dto'
import { getDeliveryMinutes, sortByKey } from './sort-helpers'

const FOOD_INCLUDE = {
  restaurant: { select: { name: true, location: true, deliveryTimeMin: true } },
  category: { select: { name: true } },
  customizationGroups: {
    include: { options: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  },
} as const

type FoodRow = FoodWithRelations

function byBoolean(raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined
  return raw === 'true'
}

function discounted(base: number, discount: number): number {
  return discount > 0 ? Math.round(base * (1 - discount / 100) * 100) / 100 : base
}

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: FoodQueryDto): Promise<PaginatedResult<ReturnType<typeof toFoodView>>> {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 8))

    const rows = (await this.prisma.food.findMany({
      where: { deletedAt: null, restaurant: { deletedAt: null, status: 'APPROVED' } },
      include: FOOD_INCLUDE,
      orderBy: { createdAt: 'asc' },
    })) as FoodRow[]

    const categoryTerm = await this.resolveCategoryTerm(query)
    let result = rows

    if (categoryTerm) {
      result = result.filter((food) => food.categoryTerm === categoryTerm || food.category?.name.toLowerCase() === categoryTerm)
    }
    if (query.vendorId) {
      result = result.filter((food) => food.restaurantId === query.vendorId)
    }
    if (query.location) {
      result = result.filter((food) => food.restaurant?.location === query.location)
    }
    if (query.minRating !== undefined) {
      result = result.filter((food) => food.rating >= (query.minRating as number))
    }
    if (byBoolean(query.dealsOnly)) {
      result = result.filter((food) => food.discount && food.discount > 0)
    }
    if (byBoolean(query.featuredOnly)) {
      result = result.filter((food) => food.featured)
    }
    if (byBoolean(query.bestSellersOnly)) {
      result = sortByKey(result, (food) => food.popularity || 0, true)
    }
    if (query.search) {
      const q = query.search.toLowerCase()
      result = result.filter(
        (food) =>
          food.name.toLowerCase().includes(q) ||
          (food.restaurant?.name || '').toLowerCase().includes(q) ||
          (food.categoryTerm || food.category?.name || '').toLowerCase().includes(q) ||
          (food.restaurant?.location || '').toLowerCase().includes(q) ||
          (food.description || '').toLowerCase().includes(q)
      )
    }

    const sort = query.sort || 'recommended'
    switch (sort) {
      case 'cheapest':
        result = [...result].sort((a, b) => discounted(a.price, a.discount) - discounted(b.price, b.discount))
        break
      case 'expensive':
        result = [...result].sort((a, b) => discounted(b.price, b.discount) - discounted(a.price, a.discount))
        break
      case 'rating':
        result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'popular':
        result = sortByKey(result, (food) => food.popularity || 0, true)
        break
      case 'fastest':
        result = [...result].sort(
          (a, b) => getDeliveryMinutes(a.deliveryTimeMin ?? a.restaurant?.deliveryTimeMin ?? 30) - getDeliveryMinutes(b.deliveryTimeMin ?? b.restaurant?.deliveryTimeMin ?? 30)
        )
        break
      case 'newest':
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        result = [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'deals':
        result = [...result].sort((a, b) => (b.discount || 0) - (a.discount || 0))
        break
      case 'nearest':
        result = sortByKey(result, (food) => food.popularity || 0, true)
        break
      case 'recommended':
      default:
        result = sortByKey(result, (food) => food.popularity || 0, true)
        break
    }

    const total = result.length
    const start = (page - 1) * pageSize
    const items = result.slice(start, start + pageSize).map((f) => toFoodView(f))

    return { data: items, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } }
  }

  async getById(id: string) {
    const food = await this.prisma.food.findFirst({
      where: { id, deletedAt: null },
      include: FOOD_INCLUDE,
    })
    if (!food) throw ApiException.notFound('NOT_FOUND', 'Food not found.')
    return toFoodView(food as FoodRow)
  }

  async byVendor(vendorId: string) {
    const foods = await this.prisma.food.findMany({
      where: { restaurantId: vendorId, deletedAt: null },
      include: FOOD_INCLUDE,
      orderBy: { popularity: 'desc' },
    })
    return foods.map((f) => toFoodView(f as FoodRow))
  }

  async similar(foodId: string, limit = 4) {
    const food = await this.prisma.food.findFirst({ where: { id: foodId, deletedAt: null } })
    if (!food) return []
    const siblings = await this.prisma.food.findMany({
      where: { restaurantId: food.restaurantId, deletedAt: null, NOT: { id: foodId } },
      include: FOOD_INCLUDE,
      take: Math.min(12, Math.max(1, limit)),
      orderBy: { popularity: 'desc' },
    })
    return siblings.map((f) => toFoodView(f as FoodRow))
  }

  /** Authoritative preview equivalent of `foodService.pricePreview`. */
  async pricePreview(dto: PricePreviewDto) {
    const food = await this.getById(dto.foodId)
    if (!food) throw ApiException.notFound('NOT_FOUND', 'Food not found.')
    if (food.available === false) {
      throw ApiException.unprocessable('FOOD_UNAVAILABLE', `${food.name} is currently unavailable.`)
    }
    let unit = discounted(food.price, food.discount)
    const groups = food.customizationGroups || []
    for (const selection of dto.selections || []) {
      const group = groups.find((g) => g.id === selection.groupId)
      if (!group) continue
      for (const optionId of selection.optionIds) {
        const option = group.options.find((o) => o.id === optionId)
        if (option && option.available !== false) unit += option.priceModifier
      }
    }
    unit = Math.round(unit * 100) / 100
    return { unitPrice: unit, lineTotal: Math.round(unit * dto.quantity * 100) / 100 }
  }

  async ensureAvailable(foodId: string, quantity: number): Promise<FoodRow> {
    const food = await this.prisma.food.findFirst({
      where: { id: foodId, deletedAt: null },
      include: FOOD_INCLUDE,
    })
    if (!food) throw ApiException.unprocessable('FOOD_NOT_FOUND', 'One of the items in your cart is no longer available.')
    if (food.available === false) {
      throw ApiException.unprocessable('FOOD_UNAVAILABLE', `${food.name} is currently unavailable.`)
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      throw ApiException.validation(`Invalid quantity for ${food.name}.`)
    }
    return food as FoodRow
  }

  private async resolveCategoryTerm(query: FoodQueryDto): Promise<string | undefined> {
    if (query.category) return query.category
    if (query.categorySlug) {
      const category = await this.prisma.foodCategory.findUnique({ where: { slug: query.categorySlug } })
      if (!category) throw ApiException.notFound('CATEGORY_NOT_FOUND', 'Category not found.')
      return category.name.toLowerCase().replace(/\s+/g, '')
    }
    return undefined
  }
}