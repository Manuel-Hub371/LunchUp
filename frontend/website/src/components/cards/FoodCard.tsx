'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Star, Plus, Check, Heart } from 'lucide-react'
import type { Food } from '@/types'
import { useCart } from '@/lib/cart/cart-context'
import { effectivePrice } from '@/lib/pricing'
import { formatPrice } from '@/lib/utils'

interface FoodCardProps {
  food: Food
  compact?: boolean
  showVendor?: boolean
}

export default function FoodCard({
  food,
  compact = false,
  showVendor = true,
}: FoodCardProps) {
  const router = useRouter()
  const { addLine } = useCart()
  const [added, setAdded] = useState(false)
  const [favorited, setFavorited] = useState(false)

  const requiresCustomization = (food.customizationGroups || []).some(
    (group) => group.required || (group.minSelections || 0) > 0
  )
  const unavailable = food.available === false
  const price = effectivePrice(food)
  const hasDiscount = !!food.discount && food.discount > 0
  const foodHref = `/food/${food.id}`
  const vendorHref = food.vendorId ? `/restaurant/${food.vendorId}` : undefined

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (requiresCustomization || unavailable) {
      router.push(foodHref)
      return
    }
    addLine(food, { quantity: 1 })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1200)
  }

  const handleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorited(!favorited)
  }

  if (compact) {
    return (
      <Link
        href={foodHref}
        className={`group block h-full ${unavailable ? 'pointer-events-none opacity-60' : ''}`}
      >
        <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border-warm bg-white shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-warm-50">
            <Image
              src={food.image}
              alt={food.name}
              fill
              sizes="33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {hasDiscount && (
              <span className="absolute left-2.5 top-2.5 rounded-lg bg-primary px-2 py-0.5 text-[11px] font-bold text-white shadow-subtle">
                -{food.discount}%
              </span>
            )}
            {unavailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-xs">
                <span className="rounded-lg bg-charcoal px-2.5 py-1 text-xs font-semibold text-white">
                  Unavailable
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col p-3.5">
            <h3 className="line-clamp-1 font-jakarta text-sm font-bold text-[#171717] group-hover:text-primary transition-colors">
              {food.name}
            </h3>
            {showVendor && (
              <p className="mt-0.5 truncate text-xs text-muted">{food.vendor}</p>
            )}
            <div className="mt-2.5 flex items-center justify-between">
              <span className="font-jakarta text-sm font-extrabold text-[#171717]">
                {formatPrice(price)}
              </span>
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-[#171717]">{food.rating}</span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-warm bg-white shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${unavailable ? 'opacity-65' : ''}`}>
      <Link
        href={foodHref}
        className="relative block aspect-[4/3] overflow-hidden bg-warm-50"
      >
        <Image
          src={food.image}
          alt={food.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {hasDiscount && (
          <span className="absolute left-3 top-3 z-10 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white shadow-subtle">
            {food.discount}% OFF
          </span>
        )}

        <button
          type="button"
          onClick={handleFavorite}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-subtle transition-all hover:scale-110 hover:bg-white"
        >
          <Heart className={`h-4 w-4 ${favorited ? 'fill-red-500 text-red-500' : 'text-[#525252]'}`} />
        </button>

        {unavailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 backdrop-blur-xs">
            <span className="rounded-xl bg-charcoal px-3.5 py-1.5 text-xs font-bold text-white shadow-card">
              Currently Unavailable
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <h3 className="line-clamp-1 font-jakarta text-base font-bold text-[#171717]">
            <Link href={foodHref} className="transition-colors hover:text-primary">
              {food.name}
            </Link>
          </h3>

          {showVendor && (
            <div className="mt-1">
              {vendorHref ? (
                <Link
                  href={vendorHref}
                  className="truncate text-xs font-medium text-muted transition-colors hover:text-primary block"
                >
                  {food.vendor}
                </Link>
              ) : (
                <p className="truncate text-xs font-medium text-muted">{food.vendor}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border-warm/60 pt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-jakarta text-base font-extrabold text-[#171717]">
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted line-through font-normal">
                {formatPrice(food.price)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-[#171717]">{food.rating}</span>
            {food.reviewCount && (
              <span className="text-muted text-[11px]">({food.reviewCount})</span>
            )}
          </div>
        </div>

        {!unavailable && (
          <button
            type="button"
            onClick={handleAdd}
            aria-label={requiresCustomization ? `Customize ${food.name}` : `Add ${food.name} to cart`}
            className={`mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold font-jakarta transition-all duration-150 ${
              added
                ? 'bg-brand-green text-white shadow-subtle'
                : 'bg-primary text-white hover:bg-primary-600 shadow-subtle hover:shadow-card'
            }`}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Added to cart
              </>
            ) : requiresCustomization ? (
              'Customize & Add'
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Add to Cart
              </>
            )}
          </button>
        )}
      </div>
    </article>
  )
}
