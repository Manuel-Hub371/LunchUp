'use client'

import React from 'react'
import { Bike, Calendar, Check, Clock, Mail, MapPin, Phone, Wallet } from 'lucide-react'
import SectionHeading from '../SectionHeading'
import type { Restaurant } from '@/types'

interface StorefrontAboutProps {
  restaurant: Restaurant
  priceRange?: string
}

interface InfoRowProps {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}

function InfoRow({ icon, label, value, href }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3.5 border-b border-[#f2ede7] py-[18px] last:border-b-0 first:pt-0 last:pb-0">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <strong className="block text-[12px] font-bold text-[#262626]">{label}</strong>
        {href ? (
          <a
            href={href}
            className="mt-1 block truncate text-[13px] text-[#858585] hover:text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="mt-1 block text-[13px] text-[#858585]">{value}</span>
        )}
      </div>
    </div>
  )
}

export default function StorefrontAbout({ restaurant, priceRange }: StorefrontAboutProps) {
  const joined = restaurant.createdAt
    ? new Date(restaurant.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : undefined

  const deliveryFee = restaurant.deliveryFee !== undefined ? `GH₵${restaurant.deliveryFee}` : undefined
  const formattedDelivery = restaurant.deliveryTime
    ? restaurant.deliveryTime.replace(/\s*-\s*/, '–')
    : undefined

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="ABOUT"
        title={`About ${restaurant.name}`}
        subtitle="Everything you need to know before you order."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="space-y-6">
          {restaurant.description ? (
            <p className="text-[14px] leading-[1.8] text-[#525252]">{restaurant.description}</p>
          ) : (
            <p className="text-[14px] leading-[1.8] text-[#a3a3a3]">
              {restaurant.name} does not have a description yet.
            </p>
          )}

          {restaurant.categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {restaurant.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-[#ece7e1] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#525252]"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            {restaurant.verified && (
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#16a34a]">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f0fdf4]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                Verified restaurant
              </span>
            )}
            {restaurant.featured && (
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#b45309]">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#fffbeb]">
                  <Calendar className="h-3.5 w-3.5" />
                </span>
                Featured listing
              </span>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-[#ece7e1] bg-white px-5 py-4">
          <h3 className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#a3a3a3]">
            Restaurant info
          </h3>
          {restaurant.opensAt && restaurant.closesAt && (
            <InfoRow
              icon={<Clock className="h-4 w-4" />}
              label="Business hours"
              value={`${restaurant.opensAt} – ${restaurant.closesAt}`}
            />
          )}
          {restaurant.location && (
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location" value={restaurant.location} />
          )}
          {formattedDelivery && (
            <InfoRow icon={<Bike className="h-4 w-4" />} label="Delivery time" value={formattedDelivery} />
          )}
          {deliveryFee && (
            <InfoRow icon={<Wallet className="h-4 w-4" />} label="Delivery fee" value={deliveryFee} />
          )}
          {priceRange && (
            <InfoRow icon={<Wallet className="h-4 w-4" />} label="Price range" value={priceRange} />
          )}
          {restaurant.contact?.phone && (
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={restaurant.contact.phone}
              href={`tel:${restaurant.contact.phone.replace(/\s+/g, '')}`}
            />
          )}
          {restaurant.contact?.email && (
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={restaurant.contact.email}
              href={`mailto:${restaurant.contact.email}`}
            />
          )}
          {joined && (
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="On LunchUp since" value={joined} />
          )}
        </aside>
      </div>
    </div>
  )
}