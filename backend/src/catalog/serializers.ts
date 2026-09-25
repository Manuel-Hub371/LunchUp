import { Food, FoodCategory, Restaurant } from '@prisma/client'

export interface FoodGroupRow {
  id: string
  name: string
  required: boolean
  minSelections: number
  maxSelections: number
  options: {
    id: string
    name: string
    priceModifier: number
    available: boolean
    isDefault: boolean
  }[]
}

export interface FoodWithRelations extends Food {
  restaurant?: Pick<Restaurant, 'name' | 'location' | 'deliveryTimeMin'> | null
  category?: Pick<FoodCategory, 'name'> | null
  customizationGroups?: FoodGroupRow[] | null
}

export interface RestaurantWithCategories extends Restaurant {
  categories?: { category: Pick<FoodCategory, 'name' | 'slug'> | null }[] | null
}

function deliveryMinutes(min: number | null | undefined): string {
  const base = min ?? 30
  return `${base}-${base + 15} min`
}

export function toFoodView<T extends FoodWithRelations>(food: T) {
  return {
    id: food.id,
    name: food.name,
    vendor: food.restaurant?.name ?? '',
    vendorId: food.restaurantId,
    rating: food.rating,
    reviewCount: food.reviewCount,
    price: food.price as number,
    discount: food.discount || 0,
    deliveryTime: deliveryMinutes(food.deliveryTimeMin ?? food.restaurant?.deliveryTimeMin),
    image: food.image ?? '',
    images: (food.images as string[] | null) ?? undefined,
    description: food.description ?? undefined,
    category: food.categoryTerm ?? food.category?.name.toLowerCase().replace(/\s+/g, ''),
    location: food.restaurant?.location ?? undefined,
    createdAt: food.createdAt.toISOString(),
    popularity: food.popularity,
    featured: food.featured,
    available: food.available,
    includedItems: (food.includedItems as string[] | null) ?? undefined,
    customizationGroups: food.customizationGroups?.length ? food.customizationGroups : undefined,
  }
}

export function toRestaurantView<R extends RestaurantWithCategories>(restaurant: R) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    rating: restaurant.rating,
    reviewCount: restaurant.reviewCount,
    deliveryTime: deliveryMinutes(restaurant.deliveryTimeMin),
    deliveryFee: restaurant.deliveryFee,
    categories: restaurant.categories?.map((c) => c.category?.name).filter((x): x is string => Boolean(x)) ?? [],
    image: restaurant.bannerUrl || restaurant.logoUrl || '',
    logo: restaurant.logoUrl || undefined,
    location: restaurant.location ?? undefined,
    isOpen: restaurant.isOpen,
    description: restaurant.description ?? undefined,
    featured: restaurant.featured,
    popularity: restaurant.popularity,
    verified: restaurant.verified,
    createdAt: restaurant.createdAt.toISOString(),
    opensAt: restaurant.opensAt ?? undefined,
    closesAt: restaurant.closesAt ?? undefined,
    services: (restaurant.services as string[] | null) ?? undefined,
    contact: {
      phone: restaurant.phone ?? undefined,
      email: restaurant.email ?? undefined,
    },
    promotion: null as { label: string; discount: number } | null,
  }
}

export function toCategoryView(category: FoodCategory) {
  return {
    id: category.id,
    name: category.name,
    image: category.image ?? '',
    slug: category.slug,
    description: category.description ?? undefined,
  }
}