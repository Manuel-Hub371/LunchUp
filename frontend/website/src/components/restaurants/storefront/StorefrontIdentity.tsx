'use client'

import React from 'react'
import Image from 'next/image'
import { BadgeCheck, Bike, Clock, MapPin, Star, Wallet } from 'lucide-react'
import { initials, type OpenStatus } from '@/lib/utils'
import type { Restaurant } from '@/types'

interface StorefrontIdentityProps {
  restaurant: Restaurant
  status: OpenStatus
  priceRange?: string
}

const STATUS_META: Record<OpenStatus, { label: string; pill: string; dot: string }> = {
  open: { label: 'Open now', pill: 'bg-[#f0fdf4] text-[#15803d]', dot: 'bg-[#16a34a]' },
  closed: { label: 'Closed', pill: 'bg-[#fef2f2] text-[#b91c1c]', dot: 'bg-[#dc2626]' },
  opening_soon: { label: 'Opening soon', pill: 'bg-[#fffbeb] text-[#b45309]', dot: 'bg-[#d97706]' },
}

export default function StorefrontIdentity({
  restaurant,
  status,
  priceRange,
}: StorefrontIdentityProps) {
  const initialsText = initials(restaurant.name)
  const meta = STATUS_META[status]
  const formattedDelivery = restaurant.deliveryTime
    ? restaurant.deliveryTime.replace(/\s*-\s*/, '–')
    : undefined

  const hasHours = !!restaurant.opensAt && !!restaurant.closesAt

  return (
    <div className="relative z-10 -mt-[50px] flex flex-col gap-4 pb-[25px] sm:-mt-[62px] sm:flex-row sm:items-start sm:gap-6 sm:pb-[34px] lg:-mt-[68px] lg:gap-7">
      {/* ---- Overlapping logo ---- */}
      <div className="w-[100px] flex-none sm:w-[112px] lg:w-[132px]">
        <div className="relative">
          <div className="relative flex h-[100px] w-[100px] items-center justify-center rounded-[20px] border-[6px] border-[#fffbf7] bg-white shadow-[0_8px_24px_rgba(23,23,23,0.12),0_2px_5px_rgba(23,23,23,0.05)] sm:h-[112px] sm:w-[112px] sm:rounded-[22px] lg:h-[132px] lg:w-[132px] lg:rounded-[24px] lg:border-[7px]">
            {restaurant.logo ? (
              <div className="absolute left-1/2 top-1/2 h-[68px] w-[68px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[15px] sm:h-[75px] sm:w-[75px] sm:rounded-[16px] lg:h-[88px] lg:w-[88px] lg:rounded-[18px]">
                <Image
                  src={restaurant.logo}
                  alt={`${restaurant.name} logo`}
                  fill
                  sizes="88px"
                  className="object-cover"
                />
              </div>
            ) : (
              <span className="grid h-[68px] w-[68px] place-items-center rounded-[15px] bg-[#fff1e6] font-extrabold text-[#ea580c] sm:h-[75px] sm:w-[75px] sm:rounded-[16px] sm:text-[24px] lg:h-[88px] lg:w-[88px] lg:rounded-[18px] lg:text-[28px]">
                <span className="text-[22px]">{initialsText}</span>
              </span>
            )}
          </div>

          {restaurant.verified && (
            <span
              title="Verified restaurant"
              aria-label="Verified restaurant"
              className="absolute -bottom-1 -right-1 z-10 grid h-[27px] w-[27px] place-items-center rounded-full border-4 border-[#fffbf7] bg-[#16a34a] text-white sm:h-[30px] sm:w-[30px]"
            >
              <BadgeCheck className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* ---- Information ---- */}
      <div className="min-w-0 flex-1 pt-[18px] sm:pt-[38px] lg:pt-[60px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-7">
          <div className="min-w-0">
            <div className="flex flex-col items-start gap-[9px] sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <h1 className="text-[27px] font-extrabold leading-[1.15] tracking-[-0.04em] text-[#171717] sm:text-[34px] lg:text-[38px]">
                {restaurant.name}
              </h1>
              <span
                className={`inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[7px] px-2.5 py-[7px] text-[11px] font-bold ${meta.pill}`}
              >
                <span className={`h-[7px] w-[7px] rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>

            {restaurant.categories.length > 0 && (
              <p className="mt-[9px] text-[13px] leading-[1.5] text-[#737373] sm:text-[14px]">
                {restaurant.categories.join(' · ')}
              </p>
            )}

            {restaurant.location && (
              <div className="mt-[11px] flex items-center gap-[7px] text-[12px] text-[#525252] sm:text-[13px]">
                <MapPin className="h-[18px] w-[18px] text-[#f97316]" />
                <span>{restaurant.location}</span>
              </div>
            )}
          </div>

          <div className="hidden shrink-0 self-start rounded-xl border border-[#ece7e1] bg-white px-3.5 py-3 lg:flex">
            <div className="flex items-center gap-2.5">
              <Star className="h-6 w-6 fill-[#f59e0b] text-[#f59e0b]" />
              <div className="flex flex-col gap-[3px]">
                <strong className="text-[18px] leading-none text-[#171717]">
                  {restaurant.rating.toFixed(1)}
                </strong>
                <span className="text-[11px] text-[#8a8a8a]">{restaurant.reviewCount} reviews</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 lg:hidden">
          <Star className="h-5 w-5 fill-[#f59e0b] text-[#f59e0b]" />
          <strong className="text-[17px] leading-none text-[#171717]">
            {restaurant.rating.toFixed(1)}
          </strong>
          <span className="text-[12px] text-[#8a8a8a]">{restaurant.reviewCount} reviews</span>
        </div>

        {restaurant.description && (
          <p className="mt-[18px] max-w-[760px] text-[13px] leading-[1.7] text-[#666666] sm:mt-[22px] sm:text-[14px] sm:leading-[1.75]">
            {restaurant.description}
          </p>
        )}

        <div className="mt-[18px] grid gap-3.5 sm:mt-[22px] lg:flex lg:flex-wrap lg:gap-7">
          {hasHours && (
            <DetailItem icon={<Clock className="h-4 w-4" />} label="Business hours" value={`${restaurant.opensAt} – ${restaurant.closesAt}`} />
          )}
          {formattedDelivery && (
            <DetailItem icon={<Bike className="h-4 w-4" />} label="Delivery time" value={`${formattedDelivery}`} />
          )}
          {priceRange && (
            <DetailItem icon={<Wallet className="h-4 w-4" />} label="Price range" value={priceRange} />
          )}
        </div>
      </div>
    </div>
  )
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-[#fff1e6] text-[#f97316]">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <strong className="text-[12px] font-bold text-[#262626]">{label}</strong>
        <span className="text-[12px] text-[#858585]">{value}</span>
      </div>
    </div>
  )
}