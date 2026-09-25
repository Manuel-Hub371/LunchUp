/**
 * Restaurant / vendor catalog service — backed by the LunchUp API.
 */
import { apiRequest, request } from './api'
import { foodService } from './food.service'
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
export async function vendorDealDiscount(vendorId: string): Promise<number> {
  const foods = await foodService.byVendor(vendorId)
  return foods.reduce((max, food) => Math.max(max, food.discount || 0), 0)
}

export function vendorCheapestDeliveryFee(vendor: Restaurant): number {
  return vendor.deliveryFee ?? 0
}

export const restaurantService = {
  async list(query: RestaurantQuery = {}): Promise<RestaurantListResult> {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.max(1, Math.min(50, query.pageSize || 6))
    const envelope = await apiRequest<Restaurant[]>('/restaurants', {
      query: {
        search: query.search,
        location: query.location,
        minRating: query.minRating,
        onlyOpen: query.onlyOpen ? 'true' : undefined,
        featuredOnly: query.featuredOnly ? 'true' : undefined,
        verifiedOnly: query.verifiedOnly ? 'true' : undefined,
        hasDeals: query.hasDeals ? 'true' : undefined,
        sort: query.sort,
        page,
        pageSize,
      },
    })
    return {
      items: envelope.data,
      total: envelope.meta?.total ?? envelope.data.length,
      page: envelope.meta?.page ?? page,
      pageSize: envelope.meta?.pageSize ?? pageSize,
    }
  },

  async getById(id: string): Promise<Restaurant | null> {
    try {
      return await request<Restaurant>(`/restaurants/${encodeURIComponent(id)}`)
    } catch {
      return null
    }
  },

  async available(id: string): Promise<{ isOpen: boolean; reason?: string }> {
    try {
      return await request<{ isOpen: boolean; reason?: string }>(
        `/restaurants/${encodeURIComponent(id)}/availability`
      )
    } catch {
      return { isOpen: false, reason: 'unavailable' }
    }
  },

  async featured(limit = 3): Promise<Restaurant[]> {
    return request<Restaurant[]>('/restaurants/featured', { query: { limit } })
  },

  async dealStrength(vendorId: string): Promise<number> {
    return vendorDealDiscount(vendorId)
  },
}