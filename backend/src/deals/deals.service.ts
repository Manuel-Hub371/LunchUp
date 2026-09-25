import { Injectable } from '@nestjs/common'
import { DealStatus, Prisma, RestaurantStatus } from '@prisma/client'
import { paginate } from '../common/pagination'
import { PaginatedResult } from '../common/response.interceptor'
import { PrismaService } from '../prisma/prisma.service'

const DEAL_INCLUDE = {
  food: true,
  restaurant: true,
} as const

type DealWithRelations = Prisma.DealGetPayload<{ include: typeof DEAL_INCLUDE }>

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  private serializer(deal: DealWithRelations) {
    const current = deal.food.price * (1 - deal.discount / 100)
    return {
      id: deal.id,
      discount: deal.discount,
      label: deal.label ?? `${deal.discount}% off`,
      originalPrice: deal.originalPrice ?? deal.food.price,
      dealPrice: Math.round(current * 100) / 100,
      expiresAt: deal.expiresAt.toISOString(),
      food: {
        id: deal.food.id,
        name: deal.food.name,
        image: deal.food.image ?? '',
        restaurantId: deal.food.restaurantId,
      },
      restaurant: {
        id: deal.restaurant.id,
        name: deal.restaurant.name,
        slug: deal.restaurant.slug,
        location: deal.restaurant.location ?? undefined,
        rating: deal.restaurant.rating,
      },
    }
  }

  async list(query: { page?: number; pageSize?: number }): Promise<PaginatedResult<ReturnType<DealsService['serializer']>>> {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 12))
    const now = new Date()
    const where: Prisma.DealWhereInput = {
      status: DealStatus.ACTIVE,
      expiresAt: { gt: now },
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      restaurant: { status: RestaurantStatus.APPROVED },
      food: { deletedAt: null },
    }
    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        include: DEAL_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.deal.count({ where }),
    ])
    return paginate(deals.map((d) => this.serializer(d)), total, page, pageSize)
  }

  /** The freshest discount seen by the food list/cart callouts. */
  async latestForRestaurant(restaurantId: string, take = 3) {
    const now = new Date()
    const deals = await this.prisma.deal.findMany({
      where: {
        restaurantId,
        status: DealStatus.ACTIVE,
        expiresAt: { gt: now },
        food: { deletedAt: null },
      },
      include: { food: true },
      orderBy: { createdAt: 'desc' },
      take: Math.min(10, take),
    })
    return deals.map((d) => ({
      id: d.id,
      foodId: d.foodId,
      discount: d.discount,
      label: d.label ?? `${d.discount}% off`,
      foodPrice: d.food.price,
      dealPrice: Math.round(d.food.price * (1 - d.discount / 100) * 100) / 100,
    }))
  }
}