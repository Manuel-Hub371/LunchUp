/**
 * Review service — lists and submits reviews for foods and vendors.
 */
import { guardedRequest, withLatency } from './api'
import { getFoodReviews, getRestaurantReviews, reviews } from '@/lib/mock-data'
import type { Review } from '@/types'
import { uid } from '@/lib/utils'

export const reviewService = {
  async forFood(foodId: string): Promise<Review[]> {
    return withLatency(getFoodReviews(foodId))
  },

  async forVendor(vendorId: string): Promise<Review[]> {
    const subjectReviews = getRestaurantReviews(vendorId)
    const merged = [...subjectReviews, ...reviews.slice(0, 2)]
    const unique = Array.from(new Map(merged.map((review) => [review.id, review])).values())
    return withLatency(unique)
  },

  async submit(input: {
    targetType: 'food' | 'vendor'
    targetId: string
    customerName: string
    rating: number
    comment: string
  }): Promise<Review> {
    const review: Review = {
      id: uid('review'),
      customerName: input.customerName || 'LunchUp Customer',
      rating: input.rating,
      comment: input.comment,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    return guardedRequest(review, () => !input.comment.trim(), 'Please add a short comment.')
  },
}