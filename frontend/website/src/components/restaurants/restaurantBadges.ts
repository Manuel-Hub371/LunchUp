import type { Restaurant } from '@/types'

/**
 * Marketplace badge for a restaurant card, derived from real properties.
 * Priority signals the strongest trust cue first.
 */
export function restaurantBadge(restaurant: Restaurant): { label: string } | null {
  if (restaurant.verified) return { label: 'VERIFIED' }
  if (restaurant.featured) return { label: 'FEATURED' }
  if (restaurant.rating >= 4.7) return { label: 'TOP RATED' }
  if ((restaurant.popularity ?? 0) >= 90) return { label: 'POPULAR' }
  return null
}