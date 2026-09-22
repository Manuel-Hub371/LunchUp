import type { DealWithFood } from '@/lib/services/deal.service'
import type { Food, Restaurant, Review } from '@/types'

export type StorefrontTabKey = 'deals' | 'services' | 'reviews' | 'food' | 'about'

/** Server-fetched data handed to the client storefront. */
export interface StorefrontData {
  restaurant: Restaurant
  menuFoods: Food[]
  deals: DealWithFood[]
  /** `null` means the review request failed (error state). */
  reviews: Review[] | null
  /** Derived from the vendor's menu, e.g. "GH₵20 – GH₵60". */
  priceRange?: string
}