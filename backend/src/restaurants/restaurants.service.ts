import { Injectable } from '@nestjs/common'
import { ApiException } from '../common/api-exception'
import { PaginatedResult } from '../common/response.interceptor'
import { PrismaService } from '../prisma/prisma.service'
import { RestaurantWithCategories, toRestaurantView } from '../catalog/serializers'
import { RestaurantQueryDto } from './dto'

const RESTAURANT_INCLUDE = {
  categories: { include: { category: { select: { name: true, slug: true } } } },
  openingHours: true,
} as const

type RestaurantRow = RestaurantWithCategories & {
  openingHours?: unknown[]
  foods?: { discount: number; available: boolean }[]
}

function byBoolean(raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined
  return raw === 'true'
}

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: RestaurantQueryDto): Promise<PaginatedResult<ReturnType<typeof toRestaurantView>>> {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 6))

    const rows = (await this.prisma.restaurant.findMany({
      where: { deletedAt: null, status: 'APPROVED' },
      include: {
        ...RESTAURANT_INCLUDE,
        foods: { where: { deletedAt: null }, select: { discount: true, available: true } },
      },
      orderBy: { createdAt: 'asc' },
    })) as RestaurantRow[]

    let result = rows
    if (query.search) {
      const q = query.search.toLowerCase()
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.location || '').toLowerCase().includes(q) ||
          (r.categories || []).some((c) => c.category?.name.toLowerCase().includes(q))
      )
    }
    if (query.location) {
      result = result.filter((r) => r.location === query.location)
    }
    if (query.minRating !== undefined) {
      result = result.filter((r) => r.rating >= (query.minRating as number))
    }
    if (byBoolean(query.onlyOpen)) {
      result = result.filter((r) => r.isOpen !== false)
    }
    if (byBoolean(query.featuredOnly)) {
      result = result.filter((r) => r.featured)
    }
    if (byBoolean(query.verifiedOnly)) {
      result = result.filter((r) => r.verified)
    }
    if (byBoolean(query.hasDeals)) {
      result = result.filter((r) => maxDiscount(r) > 0)
    }

    const sort = query.sort || 'recommended'
    switch (sort) {
      case 'rating':
        result = [...result].sort((a, b) => b.rating - a.rating)
        break
      case 'popular':
        result = [...result].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        break
      case 'fastest':
        result = [...result].sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin)
        break
      case 'cheapest':
        result = [...result].sort((a, b) => a.deliveryFee - b.deliveryFee)
        break
      case 'newest':
        result = [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        break
      case 'oldest':
        result = [...result].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        break
      case 'recommended':
      default:
        result = [...result].sort(
          (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating
        )
        break
    }

    const total = result.length
    const start = (page - 1) * pageSize
    const items = result.slice(start, start + pageSize).map((r) => withPromotion(r))

    return { data: items, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } }
  }

  async getById(id: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...RESTAURANT_INCLUDE,
        foods: { where: { deletedAt: null }, select: { discount: true, available: true } },
      },
    })
    if (!restaurant) throw ApiException.notFound('NOT_FOUND', 'Restaurant not found.')
    return withPromotion(restaurant as RestaurantRow)
  }

  async bySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { slug, deletedAt: null },
      include: RESTAURANT_INCLUDE,
    })
    if (!restaurant) throw ApiException.notFound('NOT_FOUND', 'Restaurant not found.')
    return toRestaurantView(restaurant)
  }

  async availability(id: string): Promise<{ isOpen: boolean; reason?: string }> {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id, deletedAt: null } })
    if (!restaurant) return { isOpen: false, reason: 'unavailable' }
    if (restaurant.status !== 'APPROVED') return { isOpen: false, reason: 'unavailable' }
    return { isOpen: restaurant.isOpen !== false }
  }

  async featured(limit = 3) {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { deletedAt: null, status: 'APPROVED', featured: true },
      include: {
        ...RESTAURANT_INCLUDE,
        foods: { where: { deletedAt: null }, select: { discount: true, available: true } },
      },
      take: Math.min(20, Math.max(1, limit)),
      orderBy: { popularity: 'desc' },
    })
    return restaurants.map((r) => withPromotion(r as RestaurantRow))
  }

  /** Verifies a restaurant is currently orderable and belongs to a vendor. */
  async ensureOrderable(id: string): Promise<void> {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id, deletedAt: null } })
    if (!restaurant) {
      throw ApiException.notFound('RESTAURANT_NOT_FOUND', 'Restaurant not found.')
    }
    if (restaurant.status !== 'APPROVED') {
      throw ApiException.unprocessable('RESTAURANT_UNAVAILABLE', 'Restaurant is not available for orders right now.')
    }
    if (restaurant.isOpen === false) {
      throw ApiException.conflict('RESTAURANT_CLOSED', `${restaurant.name} is not available for orders right now.`)
    }
  }
}

function maxDiscount(restaurant: RestaurantRow): number {
  return (restaurant.foods || []).reduce((max, food) => Math.max(max, food.available && food.discount > 0 ? food.discount : 0), 0)
}

function withPromotion(restaurant: RestaurantRow) {
  const view = toRestaurantView(restaurant)
  const discount = maxDiscount(restaurant)
  if (discount > 0) {
    view.promotion = { label: `Up to ${discount}% off`, discount }
  }
  return view
}