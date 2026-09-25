/**
 * Deals service — surfaces active food deals and vendor promotions.
 * Backed by the LunchUp API (`GET /deals`).
 */
import { apiRequest, request } from './api'
import { foodService } from './food.service'
import { restaurantService } from './restaurant.service'
import type { Deal, Food } from '@/types'

export interface DealWithFood extends Deal {
  food: Food
  salePrice: number
  vendorName: string
}

interface DealView {
  id: string
  discount: number
  label: string
  originalPrice: number
  dealPrice: number
  expiresAt: string
  food: { id: string; name: string; image: string; restaurantId: string }
  restaurant: { id: string; name: string; slug: string; location?: string; rating: number }
}

async function toDealWithFood(view: DealView): Promise<DealWithFood> {
  const food = await foodService.getById(view.food.id)
  return {
    id: view.id,
    foodId: view.food.id,
    discount: view.discount,
    originalPrice: view.originalPrice,
    expiresAt: view.expiresAt,
    vendorId: view.food.restaurantId,
    label: view.label,
    food: food || {
      id: view.food.id,
      name: view.food.name,
      vendor: view.restaurant.name,
      vendorId: view.food.restaurantId,
      rating: view.restaurant.rating,
      reviewCount: 0,
      price: view.originalPrice,
      deliveryTime: '30-45 min',
      image: view.food.image,
      discount: view.discount,
      location: view.restaurant.location,
      available: true,
    },
    salePrice: view.dealPrice,
    vendorName: view.restaurant.name,
  }
}

export const dealService = {
  async active(): Promise<DealWithFood[]> {
    const envelope = await apiRequest<DealView[]>('/deals', { query: { page: 1, pageSize: 50 } })
    const views = (envelope.data || []).sort((a, b) => b.discount - a.discount)
    return Promise.all(views.map(toDealWithFood))
  },

  async vendorPromotions(): Promise<
    Array<{ vendorId: string; vendorName: string; label: string; discount: number }>
  > {
    const result = await restaurantService.list({ hasDeals: true, pageSize: 50 })
    return result.items
      .filter((restaurant) => restaurant.promotion)
      .map((restaurant) => ({
        vendorId: restaurant.id,
        vendorName: restaurant.name,
        label: restaurant.promotion?.label || '',
        discount: restaurant.promotion?.discount || 0,
      }))
  },
}