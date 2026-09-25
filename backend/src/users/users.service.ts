import { Injectable } from '@nestjs/common'
import { Address, Favorite, Prisma } from '@prisma/client'
import { ApiException } from '../common/api-exception'
import { PaginatedResult } from '../common/response.interceptor'
import { paginate } from '../common/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAddressDto, CreateFavoriteDto, UpdateAddressDto, UpdateProfileDto } from './dto'

/** Serialized address matching the frontend `DeliveryAddress` shape. */
export interface AddressView {
  id: string
  label: string | null
  name: string
  phone: string
  address: string
  landmark: string | null
  city: string
  instructions: string | null
  isDefault: boolean
}

export interface FavoriteView {
  id: string
  type: 'restaurant' | 'food'
  restaurantId: string | null
  foodId: string | null
  name: string
  image: string | null
  price?: number
  rating?: number
  location?: string | null
  createdAt: Date
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name?.trim(),
        phone: dto.phone?.trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        customerProfile: { select: { location: true, preferences: true } },
        createdAt: true,
      },
    })
    return user
  }

  private toView(address: Address): AddressView {
    return {
      id: address.id,
      label: address.label,
      name: address.name,
      phone: address.phone,
      address: address.line1,
      landmark: address.landmark,
      city: address.city,
      instructions: address.instructions,
      isDefault: address.isDefault,
    }
  }

  async listAddresses(userId: string): Promise<AddressView[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    return addresses.map((a) => this.toView(a))
  }

  async createAddress(userId: string, dto: CreateAddressDto): Promise<AddressView> {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } })
      }
      const created = await tx.address.create({ data: { userId, ...dto } })
      if (!dto.isDefault) {
        const count = await tx.address.count({ where: { userId } })
        if (count === 1) {
          await tx.address.update({ where: { id: created.id }, data: { isDefault: true } })
        }
      }
      return this.toView(created)
    })
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto): Promise<AddressView> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({ where: { id: addressId, userId } })
      if (!existing) throw ApiException.notFound('NOT_FOUND', 'Address not found.')
      if (dto.isDefault) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } })
      }
      const updated = await tx.address.update({ where: { id: addressId }, data: dto })
      return this.toView(updated)
    })
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const existing = await this.prisma.address.findFirst({ where: { id: addressId, userId } })
    if (!existing) throw ApiException.notFound('NOT_FOUND', 'Address not found.')
    await this.prisma.address.delete({ where: { id: addressId } })
  }

  async listFavorites(userId: string, page = 1, pageSize = 20): Promise<PaginatedResult<FavoriteView>> {
    const where = { userId }
    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: { select: { id: true, name: true, logoUrl: true, bannerUrl: true, location: true, rating: true } },
          food: { select: { id: true, name: true, image: true, price: true, rating: true } },
        },
      }),
      this.prisma.favorite.count({ where }),
    ])

    const skip = (page - 1) * pageSize
    const view = favoritesSlice(favorites, skip, pageSize).map((f) => {
      if (f.food) {
        return {
          id: f.id,
          type: 'food' as const,
          restaurantId: null,
          foodId: f.food.id,
          name: f.food.name,
          image: f.food.image,
          price: f.food.price,
          rating: f.food.rating,
          location: null,
          createdAt: f.createdAt,
        }
      }
      return {
        id: f.id,
        type: 'restaurant' as const,
        restaurantId: f.restaurant?.id ?? null,
        foodId: null,
        name: f.restaurant?.name ?? 'Unavailable',
        image: f.restaurant?.logoUrl || f.restaurant?.bannerUrl || null,
        rating: f.restaurant?.rating,
        location: f.restaurant?.location ?? null,
        createdAt: f.createdAt,
      }
    })

    return paginate(view, total, page, pageSize)
  }

  async addFavorite(userId: string, dto: CreateFavoriteDto): Promise<FavoriteView[]> {
    if (!dto.restaurantId && !dto.foodId) {
      throw ApiException.validation('Provide either a restaurantId or foodId.')
    }
    if (dto.restaurantId && dto.foodId) {
      throw ApiException.validation('Provide only one of restaurantId or foodId.')
    }
    const existing = await this.prisma.favorite.findFirst({
      where: {
        userId,
        restaurantId: dto.restaurantId ?? undefined,
        foodId: dto.foodId ?? undefined,
      },
    })
    if (!existing) {
      await this.prisma.favorite.create({
        data: {
          userId,
          restaurantId: dto.restaurantId ?? null,
          foodId: dto.foodId ?? null,
        },
      })
    }
    const all = await this.listFavorites(userId, 1, 100)
    return all.data
  }

  async removeFavorite(userId: string, favoriteId: string): Promise<void> {
    const existing = await this.prisma.favorite.findFirst({ where: { id: favoriteId, userId } })
    if (!existing) throw ApiException.notFound('NOT_FOUND', 'Favorite not found.')
    await this.prisma.favorite.delete({ where: { id: favoriteId } })
  }
}

function favoritesSlice<T>(items: T[], skip: number, pageSize: number): T[] {
  return items.slice(skip, skip + pageSize)
}