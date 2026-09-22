'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import type { RestaurantSort } from '@/types'

export type RestaurantFilterPreset =
  | 'all'
  | 'nearby'
  | 'popular'
  | 'topRated'
  | 'new'
  | 'oldest'
  | 'verified'
  | 'featured'
  | 'open'

interface FilterTab {
  id: RestaurantFilterPreset
  label: string
  disabled?: boolean
  title?: string
}

const FILTER_TABS: FilterTab[] = [
  { id: 'all', label: 'All' },
  { id: 'nearby', label: 'Nearby', disabled: true, title: 'Coming soon — location access' },
  { id: 'popular', label: 'Popular' },
  { id: 'topRated', label: 'Top Rated' },
  { id: 'new', label: 'New' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'verified', label: 'Verified' },
  { id: 'featured', label: 'Featured' },
  { id: 'open', label: 'Open now' },
]

interface FilterBarProps {
  activeFilter: RestaurantFilterPreset
  onFilterChange: (filter: RestaurantFilterPreset) => void
  sortBy: RestaurantSort
  onSortChange: (sort: RestaurantSort) => void
  showing: number
  total: number
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export default function FilterBar({
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  showing,
  total,
  hasActiveFilters,
  onClearFilters,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Filter tabs — horizontal scroll on small screens */}
        <div
          role="tablist"
          aria-label="Restaurant filters"
          className="scrollbar-hide -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
        >
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeFilter === tab.id}
              title={tab.title}
              disabled={tab.disabled}
              onClick={() => onFilterChange(tab.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                activeFilter === tab.id
                  ? 'bg-[#171717] text-white'
                  : tab.disabled
                    ? 'cursor-not-allowed bg-white text-[#a3a3a3] ring-1 ring-[#eeeeee]'
                    : 'bg-white text-[#525252] ring-1 ring-[#ececec] hover:ring-primary hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="whitespace-nowrap text-[13px] font-semibold text-primary transition-colors hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Clear filters
            </button>
          )}

          <div className="relative shrink-0">
            <select
              aria-label="Sort restaurants"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as RestaurantSort)}
              className="appearance-none rounded-full border border-[#ececec] bg-white py-2 pl-4 pr-9 text-[13px] font-bold text-[#404040] transition-colors hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
              <option value="fastest">Fastest Delivery</option>
              <option value="cheapest">Lowest Delivery Fee</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" />
          </div>
        </div>
      </div>

      <p className="text-[13px] text-[#737373]">
        Showing{' '}
        <span className="font-bold text-[#171717]">{showing}</span> of{' '}
        <span className="font-bold text-[#171717]">{total}</span> restaurants
      </p>
    </div>
  )
}