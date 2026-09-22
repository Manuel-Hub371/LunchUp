'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Search, MapPin, SlidersHorizontal, Loader2 } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import RestaurantCard from '@/components/cards/RestaurantCard'
import RestaurantCardSkeleton from '@/components/ui/RestaurantCardSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Button from '@/components/ui/Button'
import { restaurantBadge } from '@/components/restaurants/restaurantBadges'
import { restaurantService } from '@/lib/services/restaurant.service'
import type { Restaurant, RestaurantSort, DELIVERY_LOCATIONS } from '@/types'

const SORT_OPTIONS: { value: RestaurantSort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'fastest', label: 'Fastest Delivery' },
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

export default function RestaurantsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<RestaurantSort>('recommended')
  const [showFilters, setShowFilters] = useState(false)

  const [items, setItems] = useState<Restaurant[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const seq = useRef(0)
  const pageSize = 9

  const runQuery = useCallback(
    async (nextPage: number, current: number) => {
      const result = await restaurantService.list({
        search: searchQuery || undefined,
        location: selectedLocation || undefined,
        sort: sortBy,
        page: nextPage,
        pageSize,
      })
      if (seq.current !== current) return undefined
      return result
    },
    [searchQuery, selectedLocation, sortBy]
  )

  useEffect(() => {
    const current = ++seq.current
    setPage(1)
    setLoading(true)
    setError(false)
    void runQuery(1, current)
      .then((result) => {
        if (!result) return
        setItems(result.items)
        setTotal(result.total)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [runQuery])

  const loadMore = async () => {
    setLoadingMore(true)
    const result = await runQuery(page + 1, seq.current)
    if (result) {
      setItems((prev) => [...prev, ...result.items])
      setTotal(result.total)
      setPage((prev) => prev + 1)
    }
    setLoadingMore(false)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedLocation(null)
    setSortBy('recommended')
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-border-warm/50 py-10 md:py-14">
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6 lg:px-8">
          <h1 className="font-jakarta mb-3 text-[32px] font-bold tracking-tight text-[#171717] md:text-[40px]">
            Restaurants
          </h1>
          <p className="mb-8 text-[15px] text-muted md:text-base">
            Discover restaurants and food vendors near you
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
                placeholder="Search restaurants..."
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
                onChange={(e) => setSortBy(e.target.value as RestaurantSort)}
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
        </div>
      </section>

      {/* Results */}
      <section className="py-10 md:py-14">
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6 lg:px-8">
          {!loading && (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted">
                {total === 0 ? 'No restaurants found' : `${total} ${total === 1 ? 'restaurant' : 'restaurants'}`}
              </p>
              {(searchQuery || selectedLocation || sortBy !== 'recommended') && (
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <RestaurantCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Could not load restaurants"
              description="We hit a snag while finding restaurants. Try again."
              onRetry={() => window.location.reload()}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No restaurants found"
              description="Try adjusting your search or filters."
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    marketplace
                    pageBadge={restaurantBadge(restaurant)}
                  />
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
