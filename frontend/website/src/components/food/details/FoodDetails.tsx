'use client'

import React from 'react'
import { Clock, Star } from 'lucide-react'
import FoodGallery from './FoodGallery'
import FoodCustomizer from './FoodCustomizer'
import FoodDeliveryInfo from './FoodDeliveryInfo'
import { categoryLabel } from '@/lib/category-labels'
import { effectivePrice } from '@/lib/pricing'
import { formatPrice } from '@/lib/utils'
import type { Food, Restaurant } from '@/types'

interface FoodDetailsProps {
  food: Food
  restaurant: Restaurant | null
}

function availabilityLabel(food: Food, vendorAvailable: boolean): {
  label: string
  dotClass: string
} {
  if (food.available === false) {
    return { label: 'Currently unavailable', dotClass: 'bg-[#dc2626]' }
  }
  if (!vendorAvailable) {
    return { label: 'Available when open', dotClass: 'bg-[#d97706]' }
  }
  return { label: 'Available now', dotClass: 'bg-[#16a34a]' }
}

export default function FoodDetails({ food, restaurant }: FoodDetailsProps) {
  const tag = categoryLabel(food.category)
  const formattedDelivery = food.deliveryTime
    ? food.deliveryTime.replace(/\s*-\s*/, '–')
    : null
  const hasDiscount = !!food.discount && food.discount > 0
  const price = effectivePrice(food)
  const vendorAvailable = Boolean(restaurant && restaurant.isOpen !== false)
  const availability = availabilityLabel(food, vendorAvailable)

  return (
    <section className="grid grid-cols-1 items-start gap-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
      {/* ---------- Left: gallery + restaurant summary ---------- */}
      <div className="min-w-0">
        <FoodGallery food={food} restaurant={restaurant} />
      </div>

      {/* ---------- Right: details + customizer ---------- */}
      <div className="min-w-0">
        {tag && (
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff1e6] px-3 py-1.5 text-[12px] font-extrabold text-[#ea580c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ea580c]" aria-hidden />
            {tag}
          </span>
        )}

        <h1 className="mt-4 text-[30px] font-extrabold leading-[1.16] tracking-[-1.5px] text-[#171717] sm:text-[38px] lg:text-[44px]">
          {food.name}
        </h1>

        {food.description && (
          <p className="mt-4 max-w-[490px] text-[14px] leading-[1.7] text-[#78716c] sm:text-[15px] sm:leading-[1.75]">
            {food.description}
          </p>
        )}

        {/* Meta */}
        <div className="mt-5 flex flex-wrap items-center gap-4 border-b border-[#eee8e2] pb-6">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#57534e]">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <strong className="font-extrabold text-[#171717]">{food.rating.toFixed(1)}</strong>
            <span className="text-[#57534e]">{food.reviewCount} reviews</span>
          </span>

          {formattedDelivery && (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#57534e]">
              <Clock className="h-4 w-4 text-[#ea580c]" />
              {formattedDelivery}
            </span>
          )}

          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#57534e]">
            <span className={`h-[8px] w-[8px] rounded-full ${availability.dotClass}`} aria-hidden />
            {availability.label}
          </span>
        </div>

        {/* Price row */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="block text-[12px] text-[#78716c]">Starting from</span>
            <span className="mt-0.5 block text-[30px] font-extrabold tracking-[-1px] text-[#171717]">
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="mt-0.5 block text-[13px] font-medium text-[#a8a29e] line-through">
                {formatPrice(food.price)}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-2 text-[12px] font-extrabold text-[#16a34a]">
            <span className={`h-[8px] w-[8px] rounded-full ${availability.dotClass}`} aria-hidden />
            {availability.label}
          </span>
        </div>

        {/* Customizer */}
        <FoodCustomizer food={food} vendorAvailable={vendorAvailable} />

        {/* Delivery info */}
        <FoodDeliveryInfo food={food} restaurant={restaurant} />
      </div>
    </section>
  )
}