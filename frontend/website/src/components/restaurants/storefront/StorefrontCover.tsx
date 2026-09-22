'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Check, Heart, Share2, UtensilsCrossed } from 'lucide-react'
import { initials } from '@/lib/utils'
import type { Restaurant } from '@/types'

interface StorefrontCoverProps {
  restaurant: Restaurant
  isFavorite: boolean
  copied: boolean
  onShare: () => void
  onFavorite: () => void
}

export default function StorefrontCover({
  restaurant,
  isFavorite,
  copied,
  onShare,
  onFavorite,
}: StorefrontCoverProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasCover = !!restaurant.image && !imageFailed

  return (
    <div className="relative h-[235px] w-full overflow-hidden bg-[#e7ded5] sm:h-[300px] lg:h-[350px]">
      {hasCover ? (
        <Image
          src={restaurant.image as string}
          alt={`${restaurant.name} restaurant interior and dining area`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ffe3d0] via-[#fbe2cf] to-[#eed7c4]">
          <div className="flex flex-col items-center gap-3 text-[#c8793f] opacity-80">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/80 shadow-sm">
              <UtensilsCrossed className="h-8 w-8 text-[#ea580c]" />
            </span>
            <span className="text-[15px] font-extrabold tracking-[0.1em] text-[#b06834]">
              {initials(restaurant.name)}
            </span>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/[0.04] via-black/[0.12] to-black/[0.38]" />

      <div className="absolute right-4 top-4 z-10 flex items-center gap-2.5 sm:right-8 sm:top-6">
        <button
          type="button"
          onClick={onShare}
          aria-label="Share restaurant"
          title="Share restaurant"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-white/20 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/30 hover:-translate-y-0.5 sm:h-[42px] sm:w-[42px]"
        >
          {copied ? <Check className="h-[18px] w-[18px]" /> : <Share2 className="h-[18px] w-[18px] sm:h-5 sm:w-5" />}
        </button>

        <button
          type="button"
          onClick={onFavorite}
          aria-label={isFavorite ? 'Remove restaurant from favorites' : 'Save restaurant to favorites'}
          title={isFavorite ? 'Remove from favorites' : 'Save restaurant'}
          className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 hover:bg-white/30 hover:-translate-y-0.5 sm:h-[42px] sm:w-[42px] ${
            isFavorite
              ? 'border-white/60 bg-white/40 text-[#f97316]'
              : 'border-white/35 bg-white/20 text-white'
          }`}
        >
          <Heart
            className={`h-[18px] w-[18px] sm:h-5 sm:w-5 ${isFavorite ? 'fill-[#f97316]' : ''}`}
          />
        </button>
      </div>
    </div>
  )
}