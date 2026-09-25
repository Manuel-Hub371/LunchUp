import React from 'react'
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import FoodCard from '../cards/FoodCard'
import { foodService } from '@/lib/services/food.service'

export default async function TodayDeals() {
  const dealFoods = await foodService
    .list({ dealsOnly: true, sort: 'popular', pageSize: 4 })
    .then(({ items }) => items.slice(0, 4))
    .catch(() => [])

  if (dealFoods.length === 0) return null

  return (
    <section className="bg-warm-50 py-14 md:py-20 border-b border-border-warm/50">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold tracking-wide text-primary uppercase">
              <Zap className="h-3 w-3 fill-primary" />
              Limited time
            </div>
            <h2 className="font-jakarta text-[26px] font-extrabold tracking-tight text-[#171717] sm:text-[32px]">
              Today&apos;s deals
            </h2>
            <p className="mt-1.5 text-[15px] text-muted">
              Save on meals you love
            </p>
          </div>
          <Link
            href="/deals"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-600 transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
          {dealFoods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/deals"
            className="inline-flex items-center gap-1.5 text-[15px] font-bold text-primary"
          >
            View all deals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
