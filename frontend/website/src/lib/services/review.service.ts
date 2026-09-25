/**
 * Review service — lists and submits reviews.
 * Backed by the LunchUp API (`GET/POST /reviews`).
 */
import { apiRequest, request, ApiError } from './api'
import type { Review } from '@/types'

interface ReviewView {
  id: string
  rating: number
  comment: string | null
  author: string
  authorAvatar?: string
  food?: string
  createdAt: string
}

function toReview(view: ReviewView): Review {
  return {
    id: view.id,
    customerName: view.author,
    rating: view.rating,
    comment: view.comment ?? '',
    avatar: view.authorAvatar,
    location: view.food,
    createdAt: view.createdAt,
  }
}

export const reviewService = {
  async forFood(foodId: string): Promise<Review[]> {
    try {
      const envelope = await apiRequest<ReviewView[]>('/reviews', {
        query: { restaurantId: foodId, page: 1, pageSize: 50 },
      })
      return (envelope.data || []).map(toReview)
    } catch {
      return []
    }
  },

  async forVendor(vendorId: string): Promise<Review[]> {
    const envelope = await apiRequest<ReviewView[]>('/reviews', {
      query: { restaurantId: vendorId, page: 1, pageSize: 50 },
    })
    return (envelope.data || []).map(toReview)
  },

  async submit(input: {
    targetType: 'food' | 'vendor'
    targetId: string
    customerName: string
    rating: number
    comment: string
  }): Promise<Review> {
    if (!input.comment.trim()) {
      throw new ApiError('Please add a short comment.', 422)
    }
    const review = await request<ReviewView>('/reviews', {
      method: 'POST',
      body: {
        restaurantId: input.targetId,
        rating: input.rating,
        comment: input.comment,
      },
    })
    return toReview(review)
  },
}