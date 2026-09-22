'use client'

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FoodCard from '@/components/cards/FoodCard'
import RestaurantCard from '@/components/cards/RestaurantCard'
import LoadingState from '@/components/ui/LoadingState'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { Search, Loader2 } from 'lucide-react'
import { searchService } from '@/lib/services/search.service'
import { categoryService } from '@/lib/services/category.service'
import type { Category, Food, Restaurant, SearchResults } from '@/types'

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingState label="Preparing search..." />}>
      <SearchContent />
    </Suspense>
  )
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [debounced, setDebounced] = useState(initialQuery)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const seq = useRef(0)

  const runSearch = useCallback(async (q: string) => {
    const current = ++seq.current
    setLoading(true)
    setError(false)
    try {
      const result = await searchService.search({ q })
      if (seq.current !== current) return
      setResults(result)
      const suggestionsResult = await searchService.suggestions(q)
      if (seq.current === current) setSuggestions(suggestionsResult)
    } catch {
      if (seq.current === current) setError(true)
    } finally {
      if (seq.current === current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(query)
      const params = new URLSearchParams(window.location.search)
      if (query.trim()) params.set('q', query)
      else params.delete('q')
      router.replace(`/search?${params.toString()}`, { scroll: false })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query, router])

  useEffect(() => {
    void categoryService.list().then(setCategories)
  }, [])

  useEffect(() => {
    if (debounced.trim()) {
      void runSearch(debounced)
    } else {
      setResults({ foods: [], restaurants: [], categories: [] })
      setSuggestions([])
      setLoading(false)
    }
  }, [debounced, runSearch])

  const anyResults =
    results &&
    (results.foods.length > 0 || results.restaurants.length > 0 || results.categories.length > 0)

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto container-padding py-10 lg:py-16">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-charcoal mb-4">Search LunchUp</h1>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for food, restaurants, vendors, or categories..."
              aria-label="Search"
              autoFocus
              className="w-full pl-12 pr-4 py-3.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base shadow-sm"
            />
          </div>
          {suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setQuery(suggestion)}
                  className="text-sm border border-border-warm rounded-full px-3 py-1.5 bg-white text-muted hover:border-primary hover:text-primary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {error ? (
          <ErrorState title="Search failed" description="We could not search right now. Please try again." onRetry={() => void runSearch(debounced)} />
        ) : loading ? (
          <LoadingState label="Searching..." />
        ) : !debounced.trim() ? (
          <div>
            <h2 className="text-xl font-bold text-charcoal mb-4">Popular categories</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  className="text-sm border border-border-warm rounded-full px-4 py-2 bg-white text-charcoal hover:border-primary hover:text-primary transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        ) : !anyResults ? (
          <EmptyState
            title={`No results for "${debounced}"`}
            description="Try a different search term, or browse everything we have to offer."
            actionLabel="Browse all food"
            actionHref="/order"
          />
        ) : (
          <div className="space-y-10">
            {results!.restaurants.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-charcoal mb-4">Restaurants</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results!.restaurants.map((restaurant) => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                  ))}
                </div>
              </section>
            )}

            {results!.foods.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-charcoal mb-4">Food</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {results!.foods.map((food) => (
                    <FoodCard key={food.id} food={food} />
                  ))}
                </div>
              </section>
            )}

            {results!.categories.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-charcoal mb-4">Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {results!.categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/categories/${category.slug}`}
                      className="text-sm border border-border-warm rounded-full px-4 py-2 bg-white text-charcoal hover:border-primary hover:text-primary transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}