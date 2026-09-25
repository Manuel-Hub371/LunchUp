import { Injectable } from '@nestjs/common'
import { Food, Prisma, Restaurant, Role, VendorProfile } from '@prisma/client'
import { ApiException } from '../common/api-exception'
import { PrismaService } from '../prisma/prisma.service'
import { toFoodView, toRestaurantView } from '../catalog/serializers'
import {
  CreateFoodDto,
  CreateRestaurantDto,
  RestaurantOpenDto,
  UpdateFoodDto,
  UpdateRestaurantDto,
  VendorOnboardingDto,
} from './dto'

const RESTAURANT_INCLUDE = {
  categories: { include: { category: { select: { name: true, slug: true } } } },
} as const

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireVendor(userId: string): Promise<VendorProfile> {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } })
    if (!profile) {
      throw ApiException.forbidden('Complete vendor onboarding to access this area.')
    }
    return profile
  }

  private async requireOwnRestaurant(profileId: string, restaurantId: string): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, vendorProfileId: profileId },
    })
    if (!restaurant) throw ApiException.notFound('NOT_FOUND', 'Restaurant not found.')
    return restaurant
  }

  private async requireOwnFood(profileId: string, foodId: string): Promise<Food> {
    const food = await this.prisma.food.findFirst({
      where: {
        id: foodId,
        restaurant: { vendorProfileId: profileId },
        deletedAt: null,
      },
    })
    if (!food) throw ApiException.notFound('NOT_FOUND', 'Food not found.')
    return food
  }

  async onboarding(userId: string, dto: VendorOnboardingDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!existingUser) throw ApiException.notFound('NOT_FOUND', 'Account not found.')

    const existingProfile = await this.prisma.vendorProfile.findUnique({ where: { userId } })
    if (existingProfile) {
      const profile = await this.prisma.vendorProfile.update({
        where: { userId },
        data: { ...dto },
      })
      return { profile, submitted: false, message: 'Profile updated.' }
    }

    const [profile, updatedUser] = await this.prisma.$transaction([
      this.prisma.vendorProfile.create({
        data: { userId, businessName: dto.businessName, description: dto.description, phone: dto.phone, email: dto.email, logoUrl: dto.logoUrl, bannerUrl: dto.bannerUrl, idDocumentUrl: dto.idDocumentUrl },
      }),
      this.prisma.user.update({ where: { id: userId }, data: { role: Role.VENDOR } }),
    ])
    return { profile: await this.prisma.vendorProfile.findUnique({ where: { id: profile.id } }), submitted: true, message: 'Onboarding submitted for review.' }
  }

  async profile(userId: string) {
    const profile = await this.requireVendor(userId)
    const restaurants = await this.prisma.restaurant.findMany({
      where: { vendorProfileId: profile.id },
      include: RESTAURANT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    return {
      businessName: profile.businessName,
      description: profile.description,
      phone: profile.phone,
      email: profile.email,
      status: profile.status,
      emailVerified: user?.emailVerifiedAt != null,
      claimEmail: user?.email ?? null,
      restaurants: restaurants.map((r) => ({
        ...toRestaurantView(r),
        status: r.status,
        rejectionReason: r.rejectionReason,
      })),
    }
  }

  async updateProfile(userId: string, dto: VendorOnboardingDto) {
    const profile = await this.requireVendor(userId)
    const updated = await this.prisma.vendorProfile.update({ where: { id: profile.id }, data: dto })
    return { profile: updated }
  }

  async createRestaurant(userId: string, dto: CreateRestaurantDto) {
    const profile = await this.requireVendor(userId)
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36)

    const categoryIds = dto.categories?.length
      ? await this.prisma.foodCategory.findMany({
          where: { slug: { in: dto.categories } },
          select: { id: true },
        })
      : []

    const restaurant = await this.prisma.restaurant.create({
      data: {
        vendorProfileId: profile.id,
        name: dto.name,
        slug,
        description: dto.description,
        location: dto.location,
        deliveryFee: dto.deliveryFee ?? 0,
        deliveryTimeMin: dto.deliveryTimeMin ?? 30,
        opensAt: dto.opensAt,
        closesAt: dto.closesAt,
        services: dto.services ?? undefined,
        logoUrl: dto.logoUrl,
        bannerUrl: dto.bannerUrl,
        phone: dto.phone,
        email: dto.email,
        status: 'PENDING',
        categories: categoryIds.length
          ? { create: categoryIds.map((c) => ({ categoryId: c.id })) }
          : undefined,
      },
    })
    return { ...toRestaurantView(restaurant), status: restaurant.status }
  }

  async updateRestaurant(userId: string, restaurantId: string, dto: UpdateRestaurantDto) {
    const profile = await this.requireVendor(userId)
    const restaurant = await this.requireOwnRestaurant(profile.id, restaurantId)

    const categoryIds = dto.categories?.length
      ? await this.prisma.foodCategory.findMany({
          where: { slug: { in: dto.categories } },
          select: { id: true },
        })
      : undefined

    const data: Prisma.RestaurantUpdateInput = {
      name: dto.name,
      description: dto.description,
      location: dto.location,
      deliveryFee: dto.deliveryFee,
      deliveryTimeMin: dto.deliveryTimeMin,
      opensAt: dto.opensAt,
      closesAt: dto.closesAt,
      services: dto.services,
      logoUrl: dto.logoUrl,
      bannerUrl: dto.bannerUrl,
      phone: dto.phone,
      email: dto.email,
    }
    if (categoryIds) {
      data.categories = {
        deleteMany: {},
        create: categoryIds.map((c) => ({ categoryId: c.id })),
      }
    }

    const updated = await this.prisma.restaurant.update({ where: { id: restaurant.id }, data })
    return { ...toRestaurantView(updated), status: updated.status }
  }

  async setOpen(userId: string, restaurantId: string, dto: RestaurantOpenDto) {
    const profile = await this.requireVendor(userId)
    const restaurant = await this.requireOwnRestaurant(profile.id, restaurantId)
    const updated = await this.prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { isOpen: dto.isOpen },
    })
    return { isOpen: updated.isOpen }
  }

  async listRestaurants(userId: string) {
    const profile = await this.requireVendor(userId)
    const restaurants = await this.prisma.restaurant.findMany({
      where: { vendorProfileId: profile.id },
      include: RESTAURANT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
    return restaurants.map((r) => ({
      ...toRestaurantView(r),
      status: r.status,
      rejectionReason: r.rejectionReason,
    }))
  }

  async listFoods(userId: string, restaurantId?: string) {
    const profile = await this.requireVendor(userId)
    if (restaurantId) {
      await this.requireOwnRestaurant(profile.id, restaurantId)
    }
    const foods = await this.prisma.food.findMany({
      where: {
        deletedAt: null,
        restaurant: restaurantId
          ? { id: restaurantId, vendorProfileId: profile.id }
          : { vendorProfileId: profile.id },
      },
      include: {
        restaurant: { select: { name: true, location: true, deliveryTimeMin: true } },
        category: { select: { name: true } },
        customizationGroups: { include: { options: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return foods.map((f) => toFoodView(f))
  }

  async createFood(userId: string, dto: CreateFoodDto) {
    const profile = await this.requireVendor(userId)
    await this.requireOwnRestaurant(profile.id, dto.restaurantId)

    const categoryId = dto.categorySlug
      ? (await this.prisma.foodCategory.findUnique({ where: { slug: dto.categorySlug } }))?.id
      : null

    const food = await this.prisma.food.create({
      data: {
        restaurantId: dto.restaurantId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        discount: dto.discount ?? 0,
        image: dto.image,
        images: dto.images ?? [],
        categoryId,
        categoryTerm: dto.categoryTerm,
        deliveryTimeMin: dto.deliveryTimeMin,
        includedItems: dto.includedItems ?? [],
        available: dto.available ?? true,
        featured: dto.featured ?? false,
        customizationGroups: dto.customizationGroups?.length
          ? {
              create: dto.customizationGroups.map((group, gi) => ({
                name: group.name,
                required: group.required ?? false,
                minSelections: group.minSelections ?? 0,
                maxSelections: group.maxSelections ?? 1,
                sortOrder: gi,
                options: {
                  create: group.options.map((option, oi) => ({
                    name: option.name,
                    priceModifier: option.priceModifier ?? 0,
                    isDefault: option.isDefault ?? false,
                    available: option.available ?? true,
                    sortOrder: oi,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        restaurant: { select: { name: true, location: true, deliveryTimeMin: true } },
        category: { select: { name: true } },
        customizationGroups: { include: { options: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
      },
    })
    return toFoodView(food)
  }

  async updateFood(userId: string, foodId: string, dto: UpdateFoodDto) {
    const profile = await this.requireVendor(userId)
    await this.requireOwnFood(profile.id, foodId)
    const categoryId = dto.categorySlug
      ? (await this.prisma.foodCategory.findUnique({ where: { slug: dto.categorySlug } }))?.id
      : undefined
    void categoryId

    const data: Prisma.FoodUpdateInput = {
      name: dto.name,
      description: dto.description,
      price: dto.price,
      discount: dto.discount,
      image: dto.image,
      images: dto.images,
      ...(dto.categorySlug ? { category: { connect: { slug: dto.categorySlug } } } : {}),
      ...(dto.categorySlug === '' ? { category: { disconnect: true } } : {}),
      categoryTerm: dto.categoryTerm,
      deliveryTimeMin: dto.deliveryTimeMin,
      includedItems: dto.includedItems,
      available: dto.available,
      featured: dto.featured,
    }
    if (dto.customizationGroups) {
      data.customizationGroups = {
        deleteMany: {},
        create: dto.customizationGroups.map((group, gi) => ({
          name: group.name,
          required: group.required ?? false,
          minSelections: group.minSelections ?? 0,
          maxSelections: group.maxSelections ?? 1,
          sortOrder: gi,
          options: {
            create: group.options.map((option, oi) => ({
              name: option.name,
              priceModifier: option.priceModifier ?? 0,
              isDefault: option.isDefault ?? false,
              available: option.available ?? true,
              sortOrder: oi,
            })),
          },
        })),
      }
    }

    const food = await this.prisma.food.update({
      where: { id: foodId },
      data,
      include: {
        restaurant: { select: { name: true, location: true, deliveryTimeMin: true } },
        category: { select: { name: true } },
        customizationGroups: { include: { options: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
      },
    })
    return toFoodView(food)
  }

  async deleteFood(userId: string, foodId: string) {
    const profile = await this.requireVendor(userId)
    await this.requireOwnFood(profile.id, foodId)
    await this.prisma.food.update({
      where: { id: foodId },
      data: { deletedAt: new Date(), available: false },
    })
    return { message: 'Food removed.' }
  }
}