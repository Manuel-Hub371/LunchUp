/**
 * Search service — discovers foods, restaurants/vendors and categories.
 * Backed by the LunchUp API (`GET /search`).
 */
import { apiRequest, request } from './api'
import { categoryService } from './category.service'
import type { Food, Restaurant, SearchResults } from '@/types'

export interface SearchQuery {
  q: string
  location?: string
  limitFoods?: number
  limitRestaurants?: number
}

interface FoodSearchGroup {
  name: string
  items: Food[]
}

interface CombinedSearchResponse {
  query: string
  restaurants: Restaurant[]
  foods: { term: string | null; total: number; groups: FoodSearchGroup[] }
}

export const searchService = {
  async search(query: SearchQuery): Promise<SearchResults> {
    const q = (query.q || '').trim()
    if (!q) {
      return { foods: [], restaurants: [], categories: [] }
    }

    const [data, categories] = await Promise.all([
      request<CombinedSearchResponse>('/search', {
        query: { q, location: query.location },
      }),
      categoryService.list().catch(() => []),
    ])

    const foods = (data.foods.groups || []).flatMap((group) => group.items)
    const limitFoods = query.limitFoods || 8
    const limitRestaurants = query.limitRestaurants || 6
    const matchedCategories = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(q.toLowerCase()) ||
        category.description?.toLowerCase().includes(q.toLowerCase())
    )

    return {
      foods: foods.slice(0, limitFoods),
      restaurants: (data.restaurants || []).slice(0, limitRestaurants),
      categories: matchedCategories,
    }
  },

  /** Quick category suggestion when the query matches a category name/slug. */
  categoryForQuery(q: string): string | undefined {
    return undefined
  },

  async suggestions(q: string): Promise<string[]> {
    const query = q.trim().toLowerCase()
    if (!query) return []
    try {
      const data = await request<CombinedSearchResponse>('/search', { query: { q: query } })
      const names: string[] = [
        ...(data.restaurants || []).map((restaurant) => restaurant.name),
        ...(data.foods.groups || []).flatMap((group) => group.items.map((food) => food.name)),
      ]
      const unique = Array.from(new Set(names)).filter((name) =>
        name.toLowerCase().startsWith(query)
      )
      return unique.slice(0, 8)
    } catch {
      return []
    }
  },

  async allFoods(): Promise<Food[]> {
    try {
      const envelope = await apiRequest<Food[]>('/foods', { query: { page: 1, pageSize: 50 } })
      return envelope.data
    } catch {
      return []
    }
  },
}