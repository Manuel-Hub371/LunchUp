'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Star, UtensilsCrossed } from 'lucide-react'
import { getOpenStatus, initials } from '@/lib/utils'
import type { Food, Restaurant } from '@/types'

interface FoodGalleryProps {
  food: Food
  restaurant: Restaurant | null
}

export default function FoodGallery({ food, restaurant }: FoodGalleryProps) {
  const galleryImages =
    food.images && food.images.length > 0 ? food.images : [food.image]
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasMultiple = galleryImages.length > 1
  const activeImage = galleryImages[activeIndex]
  const hasImage = !!activeImage && !imageFailed

  const vendorName = restaurant?.name || food.vendor
  const status = restaurant ? getOpenStatus(restaurant) : 'closed'
  const preparedByLabel =
    status === 'open' ? 'Open now' : status === 'opening_soon' ? 'Opening soon' : 'Currently closed'
  const preparedByValue = restaurant?.closesAt ?? restaurant?.opensAt

  return (
    <div className="lg:sticky lg:top-[110px]">
      {/* ---- Main image ---- */}
      <div className="relative overflow-hidden rounded-[24px] bg-[#f3eee8] shadow-[0_24px_70px_rgba(38,27,18,0.10)] sm:rounded-[28px]">
        {hasImage ? (
          <div className="overflow-hidden">
            <Image
              src={activeImage}
              alt={`${food.name} photo ${activeIndex + 1}`}
              width={1200}
              height={900}
              priority
              sizes="(max-width: 800px) 94vw, (max-width: 1180px) 50vw, 620px"
              className="h-[330px] w-full object-cover transition-transform duration-500 hover:scale-[1.035] sm:h-[430px] lg:h-[500px]"
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <div className="flex h-[330px] w-full items-center justify-center bg-gradient-to-br from-[#ffe3d0] via-[#fbe2cf] to-[#eed7c4] sm:h-[430px] lg:h-[500px]">
            <div className="flex flex-col items-center gap-3 text-[#c8793f] opacity-80">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/80 shadow-sm">
                <UtensilsCrossed className="h-8 w-8 text-[#ea580c]" />
              </span>
              <span className="text-[15px] font-extrabold tracking-[0.1em] text-[#b06834]">
                {initials(food.name)}
              </span>
            </div>
          </div>
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/25"
        />

        {/* Top actions */}
        <div className="absolute inset-x-5 top-5 flex items-center justify-between">
          {food.discount && food.discount > 0 ? (
            <span className="rounded-full bg-primary px-3.5 py-2 text-[12px] font-extrabold text-white shadow-[0_8px_24px_rgba(38,27,18,0.12)]">
              {food.discount}% OFF
            </span>
          ) : food.featured ? (
            <span className="rounded-full bg-white/95 px-3.5 py-2 text-[12px] font-extrabold text-[#171717] shadow-[0_8px_24px_rgba(38,27,18,0.12)]">
              Popular Choice
            </span>
          ) : food.category ? (
            <span className="rounded-full bg-white/95 px-3.5 py-2 text-[12px] font-extrabold text-[#ea580c] shadow-[0_8px_24px_rgba(38,27,18,0.12)]">
              {food.category}
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => setSaved((value) => !value)}
            aria-label={saved ? 'Remove food from favorites' : 'Save food'}
            aria-pressed={saved}
            className={`grid h-[44px] w-[44px] place-items-center rounded-full shadow-[0_8px_24px_rgba(38,27,18,0.12)] transition-all duration-200 hover:scale-105 ${
              saved ? 'bg-[#f97316] text-white' : 'bg-white/95 text-[#171717] hover:text-[#f97316]'
            }`}
          >
            <Heart className={`h-5 w-5 ${saved ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Bottom info */}
        <div className="absolute inset-x-5 bottom-5 flex items-center justify-between text-white">
          <div className="min-w-0">
            <small className="block text-[12px] opacity-90">Prepared fresh by</small>
            <strong className="block truncate text-[15px] font-extrabold">{vendorName}</strong>
            <span className="mt-0.5 block text-[11px] font-medium text-white/70">
              {preparedByLabel}
              {preparedByValue ? ` · Closes ${preparedByValue}` : ''}
            </span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/45 px-3 py-2 text-[13px] font-bold backdrop-blur-md">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {food.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* ---- Thumbnails ---- */}
      {hasMultiple && (
        <div
          aria-label={`${food.name} photo gallery`}
          className="mt-4 grid grid-cols-4 gap-3"
        >
          {galleryImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => {
                setImageFailed(false)
                setActiveIndex(index)
              }}
              aria-label={`Show ${food.name} photo ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`relative h-[68px] overflow-hidden rounded-[13px] border-2 transition-colors duration-200 sm:h-[80px] lg:h-[88px] ${
                activeIndex === index
                  ? 'border-[#f97316]'
                  : 'border-transparent hover:border-[#fdba74]'
              }`}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="(max-width: 1180px) 22vw, 140px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* ---- Restaurant summary card ---- */}
      <div className="mt-5 flex items-center gap-3.5 rounded-[16px] border border-[#eee8e2] bg-white p-4">
        <span className="relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[14px] bg-[#fff1e6]">
          {restaurant?.logo ? (
            <Image
              src={restaurant.logo}
              alt={`${restaurant.name} logo`}
              fill
              sizes="58px"
              className="object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-[18px] font-extrabold text-[#ea580c]">
              {initials(restaurant?.name || food.vendor)}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-extrabold text-[#171717]">
            {restaurant?.name || food.vendor}
          </h3>
          <p className="mt-0.5 truncate text-[12px] text-[#78716c]">
            {restaurant?.location
              ? `${restaurant.location} · ${restaurant.categories.length > 0 ? restaurant.categories[0] : food.category ?? ''}`
              : food.category || ''}
          </p>
          {restaurant?.opensAt && restaurant?.closesAt && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[#78716c]">
              <MapPin className="h-3 w-3 shrink-0 text-[#f97316]" />
              {status === 'open' ? 'Open today' : 'Closed'} · Closes at {restaurant.closesAt}
            </p>
          )}
        </div>
        {restaurant && (
          <Link
            href={`/restaurant/${restaurant.id}`}
            className="shrink-0 whitespace-nowrap text-[12px] font-extrabold text-[#ea580c] hover:underline"
          >
            View store →
          </Link>
        )}
      </div>
    </div>
  )
}