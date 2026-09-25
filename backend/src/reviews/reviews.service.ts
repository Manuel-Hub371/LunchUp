import { Injectable } from '@nestjs/common'
import { ReviewStatus } from '@prisma/client'
import { ApiException } from '../common/api-exception'
import { paginate } from '../common/pagination'
import { PaginatedResult } from '../common/response.interceptor'
import { PrismaService } from '../prisma/prisma.service'
import { EventsService } from '../realtime/events.service'
import { CreateReviewDto, ModerateReviewDto } from './dto'

type ReviewParams = { page?: number; pageSize?: number; status?: string }

export interface ReviewView {
  id: string
  rating: number
  comment: string | null
  author: string
  authorAvatar?: string
  food?: string
  createdAt: string
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService
  ) {}

  /**
   * Keeps `rating`/`reviewCount` as a rolling average over the seeded baseline
   * plus real, approved reviews. `rating` is never treated as a running sum.
   */
  private async applyRatingDelta(
    restaurantId: string,
    op:
      | { type: 'add'; rating: number }
      | { type: 'remove'; rating: number }
      | { type: 'replace'; from: number; to: number }
  ) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId } })
    if (!restaurant) return
    let count = restaurant.reviewCount
    let rating = restaurant.rating
    if (op.type === 'add') {
      rating = (rating * count + op.rating) / (count + 1)
      count += 1
    } else if (op.type === 'remove') {
      if (count <= 1) {
        rating = 0
        count = 0
      } else {
        rating = (rating * count - op.rating) / (count - 1)
        count -= 1
      }
    } else {
      rating = count > 0 ? (rating * count - op.from + op.to) / count : op.to
    }
    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { rating: Math.round(rating * 10) / 10, reviewCount: count },
    })
  }

  private serializer(review: {
    id: string
    rating: number
    comment: string | null
    customerNameSnapshot: string
    createdAt: Date
    food?: { name: string } | null
    user?: { name: string; avatarUrl: string | null } | null
  }): ReviewView {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      author: review.user && review.user.name !== review.customerNameSnapshot ? review.user.name : review.customerNameSnapshot,
      authorAvatar: review.user?.avatarUrl ?? undefined,
      food: review.food?.name,
      createdAt: review.createdAt.toISOString(),
    }
  }

  async create(userId: string, dto: CreateReviewDto) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: dto.restaurantId, deletedAt: null } })
    if (!restaurant) throw ApiException.notFound('NOT_FOUND', 'Restaurant not found.')

    if (dto.orderId) {
      const order = await this.prisma.order.findFirst({ where: { id: dto.orderId, userId } })
      if (!order) throw ApiException.notFound('NOT_FOUND', 'Order not found.')
      if (order.restaurantId !== dto.restaurantId) {
        throw ApiException.validation('The order does not belong to this restaurant.')
      }
      if (order.status !== 'DELIVERED') {
        throw ApiException.conflict('INVALID_STATE', 'You can only review orders that have been delivered.')
      }
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    const snapshot = user?.name?.trim() || user?.email.split('@')[0] || 'Customer'

    const existing = dto.orderId
      ? await this.prisma.review.findUnique({
          where: { orderId: dto.orderId },
          select: { id: true, rating: true, status: true },
        })
      : null

    const review = existing
      ? await this.prisma.review.update({
          where: { id: existing.id },
          data: { rating: dto.rating, comment: dto.comment ?? null, status: ReviewStatus.APPROVED },
          include: { food: { select: { name: true } }, user: { select: { name: true, avatarUrl: true } } },
        })
      : await this.prisma.review.create({
          data: {
            userId,
            restaurantId: dto.restaurantId,
            orderId: dto.orderId ?? null,
            foodId: dto.foodId ?? null,
            rating: dto.rating,
            comment: dto.comment ?? null,
            customerNameSnapshot: snapshot,
            status: ReviewStatus.APPROVED,
          },
          include: { food: { select: { name: true } }, user: { select: { name: true, avatarUrl: true } } },
        })

    if (existing) {
      await this.applyRatingDelta(
        dto.restaurantId,
        existing.status === ReviewStatus.APPROVED
          ? { type: 'replace', from: existing.rating, to: dto.rating }
          : { type: 'add', rating: dto.rating }
      )
    } else {
      await this.applyRatingDelta(dto.restaurantId, { type: 'add', rating: dto.rating })
    }

    await this.events.notify(userId, {
      type: 'REVIEW',
      title: 'Review submitted',
      body: `Thanks for reviewing ${restaurant.name}.`,
      data: { reviewId: review.id },
    })
    return this.serializer(review)
  }

  async listForRestaurant(restaurantId: string, query: ReviewParams): Promise<PaginatedResult<ReviewView>> {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 10))
    const where = { restaurantId, status: ReviewStatus.APPROVED }
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { food: { select: { name: true } }, user: { select: { name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ])
    return paginate(reviews.map((r) => this.serializer(r)), total, page, pageSize)
  }

  async listForVendor(userId: string, query: ReviewParams) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } })
    if (!profile) throw ApiException.forbidden('Complete vendor onboarding to access this area.')
    const restaurantIds = (
      await this.prisma.restaurant.findMany({ where: { vendorProfileId: profile.id }, select: { id: true } })
    ).map((r) => r.id)

    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 10))
    const where = {
      restaurantId: { in: restaurantIds },
      ...(query.status ? { status: query.status as ReviewStatus } : {}),
    }
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { food: { select: { name: true } }, user: { select: { name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ])
    return paginate(reviews.map((r) => this.serializer(r)), total, page, pageSize)
  }

  async adminList(query: ReviewParams) {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20))
    const where = query.status ? { status: query.status as ReviewStatus } : {}
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { food: { select: { name: true } }, user: { select: { name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ])
    return paginate(reviews.map((r) => this.serializer(r)), total, page, pageSize)
  }

  async moderate(id: string, dto: ModerateReviewDto) {
    const current = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, rating: true, status: true, restaurantId: true },
    })
    if (!current) throw ApiException.notFound('NOT_FOUND', 'Review not found.')

    const review = await this.prisma.review.update({
      where: { id },
      data: { status: dto.status as ReviewStatus },
      include: { food: { select: { name: true } }, user: { select: { name: true, avatarUrl: true } } },
    })

    const wasApproved = current.status === ReviewStatus.APPROVED
    const willBeApproved = dto.status === ReviewStatus.APPROVED
    if (wasApproved && !willBeApproved) {
      await this.applyRatingDelta(current.restaurantId, { type: 'remove', rating: current.rating })
    } else if (!wasApproved && willBeApproved) {
      await this.applyRatingDelta(current.restaurantId, { type: 'add', rating: current.rating })
    }

    return this.serializer(review)
  }
}