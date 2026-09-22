'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FoodCard from '@/components/cards/FoodCard'
import LoadingState from '@/components/ui/LoadingState'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { categoryService } from '@/lib/services/category.service'
import { foodService } from '@/lib/services/food.service'
import type { Category, Food } from '@/types'

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const [category, setCategory] = useState<Category | null>(null)
  const [foods, setFoods] = useState<Food[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      setLoading(true)
      setError(false)
      const cat = await categoryService.getBySlug(params.slug)
      if (!active) return
      if (!cat) {
        setCategory(null)
        setFoods(null)
        setLoading(false)
        return
      }
      setCategory(cat)
      try {
        const result = await foodService.list({ categorySlug: cat.slug, sort: 'popular', pageSize: 30 })
        if (active) setFoods(result.items)
      } catch {
        if (active) setError(true)
      }
      if (active) setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [params.slug])

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto container-padding py-10 lg:py-16">
        {loading ? (
          <LoadingState label="Loading category..." />
        ) : error || !category ? (
          <ErrorState
            title="Category not found"
            description="We could not find this category. Explore everything we have instead."
            onRetry={undefined}
          />
        ) : (
          <>
            <div className="flex items-center gap-5 mb-8">
              <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-2xl overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={category.image} alt="" className="object-cover w-full h-full" />
              </div>
              <div>
                <nav aria-label="Breadcrumb" className="text-sm text-muted mb-1">
                  <Link href="/order" className="hover:text-primary">
                    Order
                  </Link>
                  <span className="mx-1">/</span>
                  <span className="text-charcoal font-medium">{category.name}</span>
                </nav>
                <h1 className="text-3xl lg:text-4xl font-bold text-charcoal mb-1">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-muted">{category.description}</p>
                )}
              </div>
            </div>

            {foods && foods.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {foods.map((food) => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={`Nothing in ${category.name} yet`}
                description="We are still adding meals to this category. Check out everything else meanwhile."
                actionLabel="Browse all food"
                actionHref="/order"
              />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}