'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Clock, MapPin, Heart, BadgeCheck } from 'lucide-react'
import type { Restaurant } from '@/types'
import { formatPrice, getDeliveryMinutes } from '@/lib/utils'

interface RestaurantCardProps {
  restaurant: Restaurant
  pageBadge?: { label: string } | null
  marketplace?: boolean
}

export default function RestaurantCard({ restaurant, pageBadge, marketplace }: RestaurantCardProps) {
  const closed = restaurant.isOpen === false
  const [favorited, setFavorited] = useState(false)
  const isMarketplace = marketplace || Boolean(pageBadge)

  const handleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorited(!favorited)
  }

  const hoursLabel = isMarketplace
    ? closed
      ? restaurant.opensAt
        ? `Closed · Opens ${restaurant.opensAt}`
        : 'Closed'
      : restaurant.closesAt
        ? `Open · Closes ${restaurant.closesAt}`
        : 'Open now'
    : ''

  return (
    <Link
      href={`/restaurant/${restaurant.id}`}
      className="block h-full group"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border-warm bg-white shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
        {/* Banner */}
        <div className="relative h-44 w-full overflow-hidden bg-warm-50">
          <Image
            src={restaurant.image}
            alt={restaurant.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Favorite */}
          <button
            type="button"
            onClick={handleFavorite}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-subtle transition-all hover:scale-110 hover:bg-white"
          >
            <Heart className={`h-4 w-4 ${favorited ? 'fill-red-500 text-red-500' : 'text-[#525252]'}`} />
          </button>

          {/* Page badge (marketplace) */}
          {pageBadge && (
            <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#171717] shadow-subtle backdrop-blur-xs">
              {pageBadge.label}
            </span>
          )}

          {/* Open/closed badge */}
          <span
            className={`absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-subtle backdrop-blur-xs ${
              closed ? 'bg-black/75 text-white' : 'bg-white/95 text-brand-green'
            }`}
          >
            {!closed && <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />}
            {closed ? 'Closed' : 'Open now'}
          </span>
        </div>

        {/* Body */}
        <div className={`relative flex flex-1 flex-col px-4 pb-4 ${restaurant.logo ? 'pt-10' : 'pt-4'}`}>
          {/* Logo */}
          {restaurant.logo && (
            <div className="absolute -top-7 left-4 h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-white shadow-card">
              <Image src={restaurant.logo} alt="" fill sizes="56px" className="object-cover" />
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-jakarta text-base font-bold text-[#171717] transition-colors group-hover:text-primary">
              {restaurant.name}
            </h3>
            {restaurant.verified && (
              <BadgeCheck
                aria-label="Verified restaurant"
                className="h-5 w-5 shrink-0 text-primary"
              />
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-[#171717]">{restaurant.rating}</span>
            <span className="text-muted">({restaurant.reviewCount}+ reviews)</span>
            {restaurant.categories && restaurant.categories.length > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span className="truncate text-muted">{restaurant.categories.slice(0, 2).join(', ')}</span>
              </>
            )}
          </div>

          {restaurant.location && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" />
              <span className="truncate">{restaurant.location}</span>
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-warm/60 pt-3 text-xs">
            <span className="inline-flex items-center gap-1 text-muted">
              <Clock className="h-3.5 w-3.5 text-muted" />
              {getDeliveryMinutes(restaurant.deliveryTime)} mins
            </span>
            <span className="font-bold text-[#171717]">
              {restaurant.deliveryFee === 0 ? 'Free delivery' : formatPrice(restaurant.deliveryFee || 0)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
