/**
 * Deals service — surfaces active food deals and vendor promotions.
 */
import { withLatency } from './api'
import { deals, getFoodById, getRestaurantById } from '@/lib/mock-data'
import type { Deal, Food } from '@/types'

export interface DealWithFood extends Deal {
  food: Food
  salePrice: number
  vendorName: string
}

export const dealService = {
  async active(): Promise<DealWithFood[]> {
    const now = Date.now()
    const active: DealWithFood[] = []
    for (const deal of deals) {
      if (new Date(deal.expiresAt).getTime() < now) continue
      const food = getFoodById(deal.foodId)
      if (!food) continue
      active.push({
        ...deal,
        food,
        salePrice: Math.round(food.price * (1 - deal.discount / 100)),
        vendorName: food.vendor,
      })
    }
    return withLatency(active.sort((a, b) => b.discount - a.discount))
  },

  async vendorPromotions(): Promise<
    Array<{ vendorId: string; vendorName: string; label: string; discount: number }>
  > {
    const items = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
    ]
      .map((id) => getRestaurantById(id))
      .filter((restaurant) => restaurant?.promotion)
      .map((restaurant) => ({
        vendorId: (restaurant as NonNullable<typeof restaurant>).id,
        vendorName: (restaurant as NonNullable<typeof restaurant>).name,
        label: (restaurant as NonNullable<typeof restaurant>).promotion?.label || '',
        discount: (restaurant as NonNullable<typeof restaurant>).promotion?.discount || 0,
      }))
    return withLatency(items)
  },
}