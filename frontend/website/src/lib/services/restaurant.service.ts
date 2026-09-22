/**
 * Restaurant / vendor catalog service.
 */
import { withLatency } from './api'
import { getRestaurantById, getFoodsByVendor, restaurants } from '@/lib/mock-data'
import { getDeliveryMinutes } from '@/lib/utils'
import type { Restaurant, RestaurantSort } from '@/types'

export interface RestaurantQuery {
  search?: string
  location?: string
  minRating?: number
  onlyOpen?: boolean
  featuredOnly?: boolean
  verifiedOnly?: boolean
  hasDeals?: boolean
  sort?: RestaurantSort
  page?: number
  pageSize?: number
}

export interface RestaurantListResult {
  items: Restaurant[]
  total: number
  page: number
  pageSize: number
}

/** Average deal discount across a vendor's menu (0 when none). */
export function vendorDealDiscount(vendorId: string): number {
  const foods = getFoodsByVendor(vendorId)
  return foods.reduce((max, food) => Math.max(max, food.discount || 0), 0)
}

export function vendorCheapestDeliveryFee(vendor: Restaurant): number {
  return vendor.deliveryFee ?? 0
}

export const restaurantService = {
  async list(query: RestaurantQuery = {}): Promise<RestaurantListResult> {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.max(1, query.pageSize || 6)

    let result = [...restaurants]

    if (query.search) {
      const q = query.search.toLowerCase()
      result = result.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(q) ||
          restaurant.categories.some((category) => category.toLowerCase().includes(q)) ||
          restaurant.location?.toLowerCase().includes(q) ||
          (restaurant.description || '').toLowerCase().includes(q)
      )
    }
    if (query.location) {
      result = result.filter((restaurant) => restaurant.location === query.location)
    }
    if (query.minRating) {
      result = result.filter((restaurant) => restaurant.rating >= (query.minRating as number))
    }
    if (query.onlyOpen) {
      result = result.filter((restaurant) => restaurant.isOpen !== false)
    }
    if (query.featuredOnly) {
      result = result.filter((restaurant) => restaurant.featured)
    }
    if (query.verifiedOnly) {
      result = result.filter((restaurant) => restaurant.verified)
    }
    if (query.hasDeals) {
      result = result.filter((restaurant) => vendorDealDiscount(restaurant.id) > 0)
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
        result = [...result].sort((a, b) => getDeliveryMinutes(a.deliveryTime) - getDeliveryMinutes(b.deliveryTime))
        break
      case 'cheapest':
        result = [...result].sort((a, b) => (a.deliveryFee || 0) - (b.deliveryFee || 0))
        break
      case 'newest':
        result = [...result].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
        break
      case 'oldest':
        result = [...result].sort(
          (a, b) =>
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
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
    const items = result.slice(start, start + pageSize)

    return withLatency({ items, total, page, pageSize })
  },

  async getById(id: string): Promise<Restaurant | null> {
    return withLatency(getRestaurantById(id) || null)
  },

  async available(id: string): Promise<{ isOpen: boolean; reason?: string }> {
    const restaurant = getRestaurantById(id)
    if (!restaurant) {
      return { isOpen: false, reason: 'unavailable' }
    }
    return { isOpen: restaurant.isOpen !== false }
  },

  async featured(limit = 3): Promise<Restaurant[]> {
    const items = restaurants.filter((restaurant) => restaurant.featured).slice(0, limit)
    return withLatency(items)
  },

  async dealStrength(vendorId: string): Promise<number> {
    return withLatency(vendorDealDiscount(vendorId))
  },
}