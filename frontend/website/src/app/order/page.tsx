'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Search, MapPin, SlidersHorizontal, Loader2 } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FoodCard from '@/components/cards/FoodCard'
import FoodCardSkeleton from '@/components/ui/FoodCardSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { foodService } from '@/lib/services/food.service'
import { categoryService } from '@/lib/services/category.service'
import type { Food, FoodSort, Category } from '@/types'

const SORT_OPTIONS: { value: FoodSort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'cheapest', label: 'Lowest Price' },
  { value: 'deals', label: 'Best Deals' },
  { value: 'newest', label: 'Newest' },
]

const LOCATIONS = [
  'East Legon',
  'Osu',
  'Madina',
  'Spintex',
  'Adenta',
  'Airport Residential',
  'Labadi',
]

export default function OrderPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [categorySlug, setCategorySlug] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<FoodSort>('recommended')
  const [categories, setCategories] = useState<Category[]>([])

  const [items, setItems] = useState<Food[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pageSize = 12
  const requestSeq = useRef(0)

  // Load categories
  useEffect(() => {
    void categoryService.list().then(setCategories)
  }, [])

  // Deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    const cat = params.get('category')
    if (q) setSearchQuery(q)
    if (cat) setCategorySlug(cat)
  }, [])

  const buildQuery = useCallback(
    (overrides?: Partial<{ page: number }>) => ({
      search: searchQuery || undefined,
      categorySlug: categorySlug || undefined,
      location: selectedLocation || undefined,
      sort: sortBy,
      page: overrides?.page ?? 1,
      pageSize,
    }),
    [searchQuery, categorySlug, selectedLocation, sortBy]
  )

  const loadList = useCallback(
    async (nextPage: number, seq: number) => {
      const result = await foodService.list(buildQuery({ page: nextPage }))
      if (requestSeq.current !== seq) return null
      return result
    },
    [buildQuery]
  )

  useEffect(() => {
    const seq = ++requestSeq.current
    setPage(1)
    setLoading(true)
    setError(null)
    void loadList(1, seq)
      .then((result) => {
        if (!result) return
        setItems(result.items)
        setTotal(result.total)
      })
      .catch(() => setError('Could not load food items'))
      .finally(() => setLoading(false))
  }, [loadList])

  const loadMore = async () => {
    setLoadingMore(true)
    const seq = requestSeq.current
    const nextPage = page + 1
    const result = await loadList(nextPage, seq)
    if (result) {
      setItems((prev) => [...prev, ...result.items])
      setTotal(result.total)
      setPage(nextPage)
    }
    setLoadingMore(false)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedLocation(null)
    setCategorySlug(null)
    setSortBy('recommended')
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-border-warm/50 py-10 md:py-14">
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6 lg:px-8">
          <h1 className="font-jakarta mb-3 text-[32px] font-bold tracking-tight text-[#171717] md:text-[40px]">
            Browse Food
          </h1>
          <p className="mb-8 text-[15px] text-muted md:text-base">
            Discover meals from restaurants and vendors near you
          </p>

          {/* Search and Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for food..."
                className="w-full rounded-lg border border-border-warm py-3 pl-12 pr-4 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Location */}
            <div className="relative md:w-56">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <select
                value={selectedLocation || ''}
                onChange={(e) => setSelectedLocation(e.target.value || null)}
                className="w-full appearance-none rounded-lg border border-border-warm bg-white py-3 pl-12 pr-10 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All locations</option>
                {LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="relative md:w-52">
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as FoodSort)}
                className="w-full appearance-none rounded-lg border border-border-warm bg-white py-3 pl-12 pr-10 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                type="button"
                onClick={() => setCategorySlug(null)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  !categorySlug
                    ? 'bg-primary text-white'
                    : 'bg-white text-[#404040] hover:bg-warm-50 border border-border-warm'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategorySlug(category.slug)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    categorySlug === category.slug
                      ? 'bg-primary text-white'
                      : 'bg-white text-[#404040] hover:bg-warm-50 border border-border-warm'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-10 md:py-14">
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6 lg:px-8">
          {!loading && (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted">
                {total === 0 ? 'No food found' : `${total} ${total === 1 ? 'item' : 'items'}`}
              </p>
              {(searchQuery || selectedLocation || categorySlug || sortBy !== 'recommended') && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-semibold text-primary hover:text-primary-600"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4" aria-busy="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <FoodCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Could not load food"
              description={error}
              onRetry={() => window.location.reload()}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No food found"
              description="Try adjusting your search or filters."
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
                {items.map((food) => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>

              {items.length < total && (
                <div className="mt-10 text-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                    size="lg"
                  >
                    {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{loadingMore ? 'Loading...' : 'Load More'}</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
