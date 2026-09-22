/**
 * Category catalog service.
 */
import { withLatency } from './api'
import { categories } from '@/lib/mock-data'
import type { Category } from '@/types'

export const categoryService = {
  async list(): Promise<Category[]> {
    return withLatency(categories)
  },

  async getBySlug(slug: string): Promise<Category | null> {
    return withLatency(categories.find((category) => category.slug === slug) || null)
  },
}