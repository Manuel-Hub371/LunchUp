/**
 * Search service — discovers foods, restaurants/vendors and categories.
 */
import { withLatency } from './api'
import { foods, restaurants, categories } from '@/lib/mock-data'
import { getCategoryTerm } from '@/lib/mock-data'
import type { Food, SearchResults } from '@/types'

export interface SearchQuery {
  q: string
  limitFoods?: number
  limitRestaurants?: number
}

export const searchService = {
  async search(query: SearchQuery): Promise<SearchResults> {
    const q = (query.q || '').trim().toLowerCase()
    if (!q) {
      return withLatency({ foods: [], restaurants: [], categories: [] })
    }

    const limitFoods = query.limitFoods || 8
    const limitRestaurants = query.limitRestaurants || 6

    const matchedFoods = foods
      .filter(
        (food) =>
          food.name.toLowerCase().includes(q) ||
          food.vendor.toLowerCase().includes(q) ||
          food.category?.toLowerCase().includes(q) ||
          food.location?.toLowerCase().includes(q) ||
          (food.description || '').toLowerCase().includes(q)
      )
      .slice(0, limitFoods)

    const matchedRestaurants = restaurants
      .filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(q) ||
          restaurant.categories.some((category) => category.toLowerCase().includes(q)) ||
          restaurant.location?.toLowerCase().includes(q) ||
          (restaurant.description || '').toLowerCase().includes(q)
      )
      .slice(0, limitRestaurants)

    const matchedCategories = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(q) ||
        category.description?.toLowerCase().includes(q)
    )

    return withLatency({
      foods: matchedFoods,
      restaurants: matchedRestaurants,
      categories: matchedCategories,
    })
  },

  /** Quick category suggestion when the query matches a category name. */
  categoryForQuery(q: string): string | undefined {
    const query = q.trim().toLowerCase()
    const category = categories.find(
      (c) => c.name.toLowerCase() === query || c.slug.replace('-', ' ') === query
    )
    return category ? getCategoryTerm(category.slug) : undefined
  },

  async suggestions(q: string): Promise<string[]> {
    const query = q.trim().toLowerCase()
    if (!query) return withLatency([])
    const all: string[] = [
      ...foods.map((food) => food.name),
      ...foods.map((food) => food.vendor),
      ...restaurants.map((restaurant) => restaurant.name),
      ...categories.map((category) => category.name),
    ]
    const unique = Array.from(new Set(all)).filter((name) =>
      name.toLowerCase().startsWith(query)
    )
    return withLatency(unique.slice(0, 8))
  },

  allFoods(): Food[] {
    return foods
  },
}