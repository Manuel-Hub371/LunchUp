'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import StorefrontCover from './StorefrontCover'
import StorefrontIdentity from './StorefrontIdentity'
import StorefrontNav, { StorefrontTab } from './StorefrontNav'
import StorefrontFood from './tabs/StorefrontFood'
import StorefrontDeals from './tabs/StorefrontDeals'
import StorefrontServices from './tabs/StorefrontServices'
import StorefrontReviews from './tabs/StorefrontReviews'
import StorefrontAbout from './tabs/StorefrontAbout'
import { getOpenStatus } from '@/lib/utils'
import type { StorefrontData, StorefrontTabKey } from './types'

const VALID_TABS: StorefrontTabKey[] = ['deals', 'services', 'reviews', 'food', 'about']

function tabLabel(tab: string): StorefrontTabKey | null {
  return VALID_TABS.includes(tab as StorefrontTabKey) ? (tab as StorefrontTabKey) : null
}

export default function Storefront({
  restaurant,
  menuFoods,
  deals,
  reviews,
  priceRange,
}: StorefrontData) {
  const [active, setActive] = useState<StorefrontTabKey>('food')
  const [isFavorite, setIsFavorite] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.replace(/^#restaurant-/, '')
    const fromHash = tabLabel(hash)
    if (fromHash) setActive(fromHash)

    const onHashChange = () => {
      const next = tabLabel(window.location.hash.replace(/^#restaurant-/, ''))
      if (next) setActive(next)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const status = getOpenStatus(restaurant)

  const tabs = useMemo<StorefrontTab[]>(() => {
    const result: StorefrontTab[] = []
    if (deals.length > 0) result.push({ key: 'deals', label: 'Deals', count: deals.length })
    if (restaurant.services && restaurant.services.length > 0) {
      result.push({ key: 'services', label: 'Services' })
    }
    result.push({ key: 'reviews', label: 'Reviews', count: restaurant.reviewCount })
    result.push({ key: 'food', label: 'Food' })
    result.push({ key: 'about', label: 'About' })
    return result
  }, [deals.length, restaurant.services, restaurant.reviewCount])

  const changeTab = (tab: StorefrontTabKey) => {
    setActive(tab)
    const next = `#restaurant-${tab}`
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', next)
    }
    const panel = document.getElementById(`storefront-${tab}`)
    if (panel) {
      panel.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: restaurant.name,
          text: `Order from ${restaurant.name} on LunchUp`,
          url,
        })
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <div>
      <StorefrontCover
        restaurant={restaurant}
        isFavorite={isFavorite}
        copied={copied}
        onShare={handleShare}
        onFavorite={() => setIsFavorite((f) => !f)}
      />

      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <StorefrontIdentity restaurant={restaurant} status={status} priceRange={priceRange} />

        <StorefrontNav tabs={tabs} active={active} onTabChange={changeTab} />

        {status !== 'open' && (
          <div
            role="status"
            className={`mt-6 flex items-center gap-3 rounded-2xl border px-5 py-4 ${
              status === 'closed'
                ? 'border-red-100 bg-red-50'
                : 'border-amber-100 bg-amber-50'
            }`}
          >
            <Clock
              className={`h-5 w-5 shrink-0 ${
                status === 'closed' ? 'text-red-500' : 'text-amber-600'
              }`}
            />
            <p className="text-[13px] leading-[1.5] text-[#404040]">
              {status === 'closed'
                ? `${restaurant.name} is currently closed. You can still browse the menu and plan your order.`
                : `${restaurant.name} opens again shortly. You can start building your order now.`}
            </p>
          </div>
        )}

        <div className="scroll-mt-24 pb-[72px] pt-[42px]" id={`storefront-${active}`} role="tabpanel">
          {active === 'deals' && <StorefrontDeals restaurant={restaurant} deals={deals} />}
          {active === 'services' && (
            <StorefrontServices name={restaurant.name} services={restaurant.services ?? []} />
          )}
          {active === 'reviews' && <StorefrontReviews restaurant={restaurant} reviews={reviews} />}
          {active === 'food' && <StorefrontFood restaurant={restaurant} foods={menuFoods} />}
          {active === 'about' && <StorefrontAbout restaurant={restaurant} priceRange={priceRange} />}
        </div>
      </div>
    </div>
  )
}