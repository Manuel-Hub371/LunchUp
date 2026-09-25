/**
 * Food catalog service — backed by the LunchUp API.
 *
 * Orchestrates the food catalog used by discovery, storefronts, search and
 * food detail. All filtering, sorting and pricing is authoritative on the
 * server; this module only translates query params and view shapes.
 */
import { apiRequest, request } from './api'
import type { Food, FoodSort, CartSelection } from '@/types'

export interface FoodQuery {
  search?: string
  /** Food.category term, e.g. 'local' | 'fastfood'. */
  category?: string
  /** Category slug from the catalog, e.g. 'local-dishes'. */
  categorySlug?: string
  vendorId?: string
  location?: string
  minRating?: number
  dealsOnly?: boolean
  featuredOnly?: boolean
  bestSellersOnly?: boolean
  sort?: FoodSort
  page?: number
  pageSize?: number
}

export interface FoodListResult {
  items: Food[]
  total: number
  page: number
  pageSize: number
}

export const foodService = {
  async list(query: FoodQuery = {}): Promise<FoodListResult> {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.max(1, Math.min(50, query.pageSize || 8))
    const envelope = await apiRequest<Food[]>('/foods', {
      query: {
        search: query.search,
        category: query.category,
        categorySlug: query.categorySlug,
        vendorId: query.vendorId,
        location: query.location,
        minRating: query.minRating,
        dealsOnly: query.dealsOnly ? 'true' : undefined,
        featuredOnly: query.featuredOnly ? 'true' : undefined,
        bestSellersOnly: query.bestSellersOnly ? 'true' : undefined,
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

  async getById(id: string): Promise<Food | null> {
    try {
      return await request<Food>(`/foods/${encodeURIComponent(id)}`)
    } catch {
      return null
    }
  },

  async byVendor(vendorId: string): Promise<Food[]> {
    const envelope = await apiRequest<Food[]>('/foods', {
      query: { vendorId, page: 1, pageSize: 50 },
    })
    return envelope.data
  },

  async similar(foodId: string, limit = 4): Promise<Food[]> {
    return request<Food[]>(`/foods/${encodeURIComponent(foodId)}/similar`, {
      query: { limit },
    })
  },

  /**
   * Server-computed price preview for a food + selection configuration. The
   * authoritative amount is recomputed again at order creation.
   */
  async pricePreview(foodId: string, selections: CartSelection[], quantity: number) {
    const preview = await request<{ unitPrice: number; lineTotal: number }>('/foods/price-preview', {
      method: 'POST',
      body: { foodId, quantity, selections },
    })
    return {
      unitPrice: Math.round(preview.unitPrice * 100) / 100,
      lineTotal: Math.round(preview.lineTotal * 100) / 100,
    }
  },
}