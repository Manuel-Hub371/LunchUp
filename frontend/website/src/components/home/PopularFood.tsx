import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import FoodCard from '../cards/FoodCard'
import { foodService } from '@/lib/services/food.service'

export default async function PopularFood() {
  const popularFoods = await foodService
    .list({ sort: 'popular', pageSize: 6 })
    .then(({ items }) => items.filter((food) => !food.discount).slice(0, 4))
    .catch(() => [])

  if (popularFoods.length === 0) return null

  return (
    <section className="bg-white py-14 md:py-20 border-b border-border-warm/50">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-jakarta text-[26px] font-extrabold tracking-tight text-[#171717] sm:text-[32px]">
              Popular right now
            </h2>
            <p className="mt-1.5 text-[15px] text-muted">
              What people are ordering
            </p>
          </div>
          <Link
            href="/order"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-600 transition-colors"
          >
            Browse all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
          {popularFoods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/order"
            className="inline-flex items-center gap-1.5 text-[15px] font-bold text-primary"
          >
            Browse all food
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
