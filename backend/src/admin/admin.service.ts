import { Injectable } from '@nestjs/common'
import { Prisma, RestaurantStatus, Role, UserStatus } from '@prisma/client'
import { ApiException } from '../common/api-exception'
import { paginate } from '../common/pagination'
import { PaginatedResult } from '../common/response.interceptor'
import { PrismaService } from '../prisma/prisma.service'
import { ApproveRestaurantDto, CreateCategoryDto, RejectRestaurantDto, ToggleUserStatusDto, UpdateCategoryDto } from './dto'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [userCounts, restaurantCounts, ordersToday, ordersMonth, revenueAgg, categoryCount, foodCount, recentOrders] =
      await Promise.all([
        this.prisma.user.groupBy({ by: ['role'], _count: { _all: true }, where: { deletedAt: null } }),
        this.prisma.restaurant.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
        this.prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
        this.prisma.order.aggregate({
          _sum: { total: true },
          where: { paymentStatus: 'SUCCESS', status: { notIn: ['CANCELLED', 'REFUNDED', 'REJECTED'] } },
        }),
        this.prisma.foodCategory.count(),
        this.prisma.food.count({ where: { deletedAt: null } }),
        this.prisma.order.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            number: true,
            total: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            restaurant: { select: { name: true } },
          },
        }),
      ])

    return {
      summary: {
        users: userCounts.reduce((sum, row) => sum + row._count._all, 0),
        byRole: Object.fromEntries(userCounts.map((row) => [row.role, row._count._all])),
        restaurants: restaurantCounts.reduce((sum, row) => sum + row._count._all, 0),
        restaurantsByStatus: Object.fromEntries(restaurantCounts.map((row) => [row.status, row._count._all])),
        ordersToday,
        ordersThisMonth: ordersMonth,
        revenue: Math.round((revenueAgg._sum.total ?? 0) * 100) / 100,
        categories: categoryCount,
        foods: foodCount,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        number: o.number,
        restaurant: o.restaurant?.name ?? '',
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt.toISOString(),
      })),
    }
  }

  async listRestaurants(query: { status?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20))
    const where = query.status ? { status: query.status as RestaurantStatus } : {}
    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        include: {
          vendorProfile: { select: { businessName: true, status: true, phone: true, email: true, idDocumentUrl: true } },
          categories: { include: { category: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.restaurant.count({ where }),
    ])
    return paginate(
      restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        location: r.location ?? undefined,
        status: r.status,
        verified: r.verified,
        featured: r.featured,
        rejectionReason: r.rejectionReason ?? undefined,
        categories: r.categories.map((c) => c.category?.name).filter((n): n is string => Boolean(n)),
        vendorProfile: {
          businessName: r.vendorProfile?.businessName,
          status: r.vendorProfile?.status,
          phone: r.vendorProfile?.phone ?? undefined,
          email: r.vendorProfile?.email ?? undefined,
          idDocumentUrl: r.vendorProfile?.idDocumentUrl ?? undefined,
        },
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize
    )
  }

  async approveRestaurant(id: string, dto: ApproveRestaurantDto) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id },
      include: { vendorProfile: true },
    })
    if (!restaurant) throw ApiException.notFound('NOT_FOUND', 'Restaurant not found.')
    if (restaurant.status === 'APPROVED') {
      return { id: restaurant.id, status: restaurant.status }
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.restaurant.update({
        where: { id },
        data: { status: RestaurantStatus.APPROVED, verified: true, rejectionReason: null },
      })
      if (restaurant.vendorProfile && restaurant.vendorProfile.status !== 'APPROVED') {
        await tx.vendorProfile.update({
          where: { id: restaurant.vendorProfile.id },
          data: { status: 'APPROVED' },
        })
      }
      return result
    })
    return {
      id: updated.id,
      status: updated.status,
      verified: updated.verified,
      note: dto.note ?? null,
    }
  }

  async rejectRestaurant(id: string, dto: RejectRestaurantDto) {
    if (!dto.reason?.trim()) throw ApiException.validation('A rejection reason is required.')
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: { status: RestaurantStatus.REJECTED, verified: false, rejectionReason: dto.reason },
    })
    return { id: restaurant.id, status: restaurant.status, rejectionReason: dto.reason }
  }

  async createCategory(dto: CreateCategoryDto) {
    const slug = dto.slug.toLowerCase().replace(/\s+/g, '-')
    const existing = await this.prisma.foodCategory.findUnique({ where: { slug } })
    if (existing) throw ApiException.conflict('DUPLICATE_SLUG', 'A category with this slug already exists.')
    const created = await this.prisma.foodCategory.create({
      data: { name: dto.name, slug, image: dto.image ?? null, description: dto.description ?? null },
    })
    return this.categoryView(created)
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.foodCategory.findUnique({ where: { id } })
    if (!existing) throw ApiException.notFound('NOT_FOUND', 'Category not found.')
    const updated = await this.prisma.foodCategory.update({
      where: { id },
      data: { name: dto.name, image: dto.image, description: dto.description },
    })
    return this.categoryView(updated)
  }

  async listUsers(query: { search?: string; role?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20))
    const where: Prisma.UserWhereInput = { deletedAt: null }
    if (query.role) where.role = query.role as Role
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ]
    }
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, phone: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ])
    return paginate(users, total, page, pageSize)
  }

  async setUserStatus(id: string, dto: ToggleUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw ApiException.notFound('NOT_FOUND', 'User not found.')
    await this.prisma.user.update({ where: { id }, data: { status: dto.status as UserStatus } })
    return { id, status: dto.status }
  }

  private categoryView(category: { id: string; name: string; slug: string; image: string | null; description: string | null }) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image ?? '',
      description: category.description ?? undefined,
    }
  }
}