import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { toFoodView, toRestaurantView } from '../catalog/serializers'

const RESTAURANT_INCLUDE = {
  categories: { include: { category: { select: { name: true, slug: true } } } },
  openingHours: true,
} as const

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchRestaurants(q: string, location?: string, limit = 24) {
    const where: Prisma.RestaurantWhereInput = { deletedAt: null, status: 'APPROVED' }
    if (q.trim()) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (location) where.location = location

    const restaurants = await this.prisma.restaurant.findMany({
      where,
      include: {
        ...RESTAURANT_INCLUDE,
        foods: { where: { deletedAt: null }, select: { discount: true, available: true } },
      },
      orderBy: { popularity: 'desc' },
      take: Math.min(50, limit),
    })
    return restaurants.map((r) => {
      const view = toRestaurantView(r)
      const maxDiscount = (r.foods || []).reduce(
        (m, f) => Math.max(m, f.available && f.discount > 0 ? f.discount : 0),
        0
      )
      if (maxDiscount > 0) view.promotion = { label: `Up to ${maxDiscount}% off`, discount: maxDiscount }
      return view
    })
  }

  async searchFoods(q: string, term?: string, sort?: string, limit = 48) {
    const where: Prisma.FoodWhereInput = { deletedAt: null, available: true }
    if (q.trim()) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (term) {
      where.OR = [...(where.OR || []), { categoryTerm: { equals: term, mode: 'insensitive' } }]
    }

    const orderBy: Prisma.FoodOrderByWithRelationInput[] =
      sort === 'price_asc'
        ? [{ price: 'asc' }]
        : sort === 'price_desc'
          ? [{ price: 'desc' }]
          : sort === 'rating'
            ? [{ rating: 'desc' }]
            : [{ popularity: 'desc' }]

    const foods = await this.prisma.food.findMany({
      where,
      include: {
        restaurant: { select: { name: true, location: true, deliveryTimeMin: true } },
        category: { select: { name: true } },
        customizationGroups: {
          include: { options: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy,
      take: Math.min(60, limit),
    })

    const grouped = new Map<string, ReturnType<typeof toFoodView>[]>()
    for (const food of foods) {
      const view = toFoodView(food)
      const key = food.categoryTerm ?? food.category?.name ?? 'Other'
      const list = grouped.get(key) ?? []
      list.push(view)
      grouped.set(key, list)
    }

    return {
      term: term ?? null,
      total: foods.length,
      groups: Array.from(grouped.entries())
        .map(([name, items]) => ({ name, items }))
        .sort((a, b) => b.items.length - a.items.length),
    }
  }
}