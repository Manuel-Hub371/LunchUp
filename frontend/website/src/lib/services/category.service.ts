/**
 * Category catalog service — backed by the LunchUp API.
 */
import { apiRequest, request } from './api'
import type { Category } from '@/types'

export const categoryService = {
  async list(): Promise<Category[]> {
    const envelope = await apiRequest<Category[]>('/categories', {
      query: { page: 1, pageSize: 100 },
    })
    return envelope.data
  },

  async getBySlug(slug: string): Promise<Category | null> {
    try {
      return await request<Category>(`/categories/${encodeURIComponent(slug)}`)
    } catch {
      return null
    }
  },
}