import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import RestaurantCard from '../cards/RestaurantCard'
import { restaurantBadge } from '../restaurants/restaurantBadges'
import { getFeaturedRestaurants } from '@/lib/mock-data'

export default function FeaturedRestaurants() {
  const featuredRestaurants = getFeaturedRestaurants(3)

  return (
    <section className="bg-warm-50 py-14 md:py-20 border-b border-border-warm/50">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-jakarta text-[26px] font-extrabold tracking-tight text-[#171717] sm:text-[32px]">
              Featured restaurants
            </h2>
            <p className="mt-1.5 text-[15px] text-muted">
              Top-rated spots near you
            </p>
          </div>
          <Link
            href="/restaurants"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-600 transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featuredRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              marketplace
              pageBadge={restaurantBadge(restaurant)}
            />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/restaurants"
            className="inline-flex items-center gap-1.5 text-[15px] font-bold text-primary"
          >
            View all restaurants
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
