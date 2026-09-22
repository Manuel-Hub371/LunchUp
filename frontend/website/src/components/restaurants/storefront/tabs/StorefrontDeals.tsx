'use client'

import React from 'react'
import FoodCard from '@/components/cards/FoodCard'
import EmptyState from '@/components/ui/EmptyState'
import { BadgePercent, Tag } from 'lucide-react'
import SectionHeading from '../SectionHeading'
import type { DealWithFood } from '@/lib/services/deal.service'
import type { Restaurant } from '@/types'

interface StorefrontDealsProps {
  restaurant: Restaurant
  deals: DealWithFood[]
}

export default function StorefrontDeals({ restaurant, deals }: StorefrontDealsProps) {
  const promotion = restaurant.promotion

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="CURRENT OFFERS"
        title={`Deals at ${restaurant.name}`}
        subtitle="Active discounts and promotions on this restaurant's menu."
      />

      {promotion && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50 px-5 py-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-white">
            <BadgePercent className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-charcoal">{promotion.label}</p>
            <p className="mt-0.5 text-[12px] text-[#666666]">
              {promotion.discount > 0
                ? `${promotion.discount}% off your order at this restaurant.`
                : 'Use this offer on your next order.'}
            </p>
          </div>
        </div>
      )}

      {deals.length === 0 ? (
        <div className="rounded-2xl border border-[#ece7e1] bg-white">
          <EmptyState
            icon={<Tag className="h-8 w-8 text-primary" />}
            title="No active deals right now"
            description="Check back soon — new offers are added regularly."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <FoodCard key={deal.food.id} food={deal.food} />
          ))}
        </div>
      )}
    </div>
  )
}