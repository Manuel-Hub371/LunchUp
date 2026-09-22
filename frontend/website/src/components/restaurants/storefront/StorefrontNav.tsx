'use client'

import React from 'react'
import { StorefrontTabKey } from './types'

export interface StorefrontTab {
  key: StorefrontTabKey
  label: string
  count?: number
}

interface StorefrontNavProps {
  tabs: StorefrontTab[]
  active: StorefrontTabKey
  onTabChange: (tab: StorefrontTabKey) => void
}

export default function StorefrontNav({ tabs, active, onTabChange }: StorefrontNavProps) {
  return (
    <nav aria-label="Restaurant navigation" className="relative">
      <div
        role="tablist"
        aria-label="Restaurant sections"
        className="scrollbar-hide flex items-center gap-2 overflow-x-auto border-y border-[#e9e2da] sm:gap-4 lg:gap-[30px]"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === active
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`storefront-${tab.key}`}
              onClick={() => onTabChange(tab.key)}
              className={`relative inline-flex h-[60px] shrink-0 items-center gap-2 px-3 text-[12px] font-bold transition-colors duration-200 first:pl-0 sm:text-[14px] lg:h-[68px] ${
                isActive ? 'text-[#ea580c]' : 'text-[#737373] hover:text-[#ea580c]'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="flex h-[21px] min-w-[21px] items-center justify-center rounded-[6px] bg-[#f5f5f4] px-1.5 text-[10px] font-bold text-[#a3a3a3]">
                  {tab.count}
                </span>
              )}
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 -bottom-px h-[3px] rounded-t-[4px] transition-colors duration-200 ${
                  isActive ? 'bg-[#f97316]' : 'bg-transparent'
                }`}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}