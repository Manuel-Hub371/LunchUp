'use client'

import React from 'react'
import FoodCard from '@/components/cards/FoodCard'
import EmptyState from '@/components/ui/EmptyState'
import { UtensilsCrossed } from 'lucide-react'
import SectionHeading from '../SectionHeading'
import type { Food, Restaurant } from '@/types'

interface StorefrontFoodProps {
  restaurant: Restaurant
  foods: Food[]
}

export default function StorefrontFood({ restaurant, foods }: StorefrontFoodProps) {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="FROM OUR KITCHEN"
        title="Explore our food"
        subtitle={`Fresh meals prepared and served by ${restaurant.name}.`}
        actionLabel="Browse all food"
        actionHref="/order"
      />

      {foods.length === 0 ? (
        <div className="rounded-2xl border border-[#ece7e1] bg-white">
          <EmptyState
            icon={<UtensilsCrossed className="h-8 w-8 text-primary" />}
            title="Menu coming soon"
            description="This restaurant has not added menu items yet. Check back shortly."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      )}
    </div>
  )
}