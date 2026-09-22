/**
 * Food catalog service.
 *
 * Orchestrates the food catalog used by discovery, storefronts, search and
 * food detail. Reads from the development dataset today; swap internals for
 * the real API later without touching components.
 */
import { withLatency } from './api'
import { getCategoryTerm, getFoodById, getFoodsByVendor, getDiscountedPrice } from '@/lib/mock-data'
import { getDeliveryMinutes, sortByKey } from '@/lib/utils'
import { foods } from '@/lib/mock-data'
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

function applySearch(food: Food, query: string): boolean {
  const q = query.toLowerCase()
  return (
    food.name.toLowerCase().includes(q) ||
    food.vendor.toLowerCase().includes(q) ||
    food.category?.toLowerCase().includes(q) ||
    food.location?.toLowerCase().includes(q) ||
    (food.description || '').toLowerCase().includes(q)
  )
}

export const foodService = {
  async list(query: FoodQuery = {}): Promise<FoodListResult> {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.max(1, query.pageSize || 8)

    let result = [...foods]

    const categoryTerm = query.category || (query.categorySlug ? getCategoryTerm(query.categorySlug) : undefined)
    if (categoryTerm) {
      result = result.filter((food) => food.category === categoryTerm)
    }
    if (query.vendorId) {
      result = result.filter((food) => food.vendorId === query.vendorId)
    }
    if (query.location) {
      result = result.filter((food) => food.location === query.location)
    }
    if (query.minRating) {
      result = result.filter((food) => food.rating >= (query.minRating as number))
    }
    if (query.dealsOnly) {
      result = result.filter((food) => food.discount && food.discount > 0)
    }
    if (query.featuredOnly) {
      result = result.filter((food) => food.featured)
    }
    if (query.bestSellersOnly) {
      result = sortByKey(result, (food) => food.popularity || 0)
    }
    if (query.search) {
      result = result.filter((food) => applySearch(food, query.search as string))
    }

    const sort = query.sort || 'recommended'
    switch (sort) {
      case 'cheapest':
        result = [...result].sort((a, b) => getDiscountedPrice(a) - getDiscountedPrice(b))
        break
      case 'expensive':
        result = [...result].sort((a, b) => getDiscountedPrice(b) - getDiscountedPrice(a))
        break
      case 'rating':
        result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'popular':
        result = sortByKey(result, (food) => food.popularity || 0)
        break
      case 'fastest':
        result = [...result].sort((a, b) => getDeliveryMinutes(a.deliveryTime) - getDeliveryMinutes(b.deliveryTime))
        break
      case 'newest':
        result = [...result].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        break
      case 'oldest':
        result = [...result].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
        break
      case 'deals':
        result = [...result].sort((a, b) => (b.discount || 0) - (a.discount || 0))
        break
      case 'nearest':
        result = sortByKey(result, (food) => food.popularity || 0)
        break
      case 'recommended':
      default:
        result = sortByKey(result, (food) => food.popularity || 0)
        break
    }

    const total = result.length
    const start = (page - 1) * pageSize
    const items = result.slice(start, start + pageSize)

    return withLatency({ items, total, page, pageSize })
  },

  async getById(id: string): Promise<Food | null> {
    return withLatency(getFoodById(id) || null)
  },

  async byVendor(vendorId: string): Promise<Food[]> {
    return withLatency(getFoodsByVendor(vendorId))
  },

  async similar(foodId: string, limit = 4): Promise<Food[]> {
    const food = getFoodById(foodId)
    if (!food) return withLatency([])
    return withLatency(
      getFoodsByVendor(food.vendorId).filter((item) => item.id !== foodId).slice(0, limit)
    )
  },

  /**
   * Authoritative price preview for a food + selection. Recomputes from the
   * catalog so a stale client configuration still produces a correct amount.
   * The final authoritative amount is computed again at order creation.
   */
  async pricePreview(foodId: string, selections: CartSelection[], quantity: number) {
    const food = await this.getById(foodId)
    if (!food) {
      throw new Error('Food not found')
    }
    let unit = getDiscountedPrice(food)
    for (const selection of selections) {
      const group = food.customizationGroups?.find((g) => g.id === selection.groupId)
      if (!group) continue
      for (const optionId of selection.optionIds) {
        const option = group.options.find((o) => o.id === optionId)
        if (option && option.available !== false) unit += option.priceModifier
      }
    }
    return withLatency({ unitPrice: Math.round(unit * 100) / 100, lineTotal: Math.round(unit * quantity * 100) / 100 })
  },
}