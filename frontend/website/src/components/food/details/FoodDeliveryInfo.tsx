'use client'

import React from 'react'
import { Clock, MapPin } from 'lucide-react'
import type { Food, Restaurant } from '@/types'

interface FoodDeliveryInfoProps {
  food: Food
  restaurant: Restaurant | null
}

export default function FoodDeliveryInfo({ food, restaurant }: FoodDeliveryInfoProps) {
  const formattedDelivery = food.deliveryTime
    ? food.deliveryTime.replace(/\s*-\s*/, '–')
    : null
  const location = restaurant?.location || food.location || null

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex items-center gap-2.5 rounded-[13px] bg-[#f8f5f1] px-3.5 py-3">
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-white text-[#ea580c]">
          <Clock className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <small className="block text-[10px] text-[#78716c]">Estimated delivery</small>
          <strong className="block truncate text-[12px] text-[#171717]">
            {formattedDelivery ?? 'Estimated at checkout'}
          </strong>
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-[13px] bg-[#f8f5f1] px-3.5 py-3">
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-white text-[#ea580c]">
          <MapPin className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <small className="block text-[10px] text-[#78716c]">Delivery location</small>
          <strong className="block truncate text-[12px] text-[#171717]">
            {location ?? 'Choose at checkout'}
          </strong>
        </div>
      </div>
    </div>
  )
}