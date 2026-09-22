'use client'

import React from 'react'
import EmptyState from '@/components/ui/EmptyState'
import { CakeSlice, CalendarCheck, PartyPopper, ShoppingBag, Sparkles, Store, Truck, UtensilsCrossed } from 'lucide-react'
import SectionHeading from '../SectionHeading'

interface StorefrontServicesProps {
  name: string
  services: string[]
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'Dine-in': <UtensilsCrossed className="h-5 w-5" />,
  'Takeaway & Pickup': <ShoppingBag className="h-5 w-5" />,
  'Delivery': <Truck className="h-5 w-5" />,
  'Party catering': <PartyPopper className="h-5 w-5" />,
  'Custom group orders': <CalendarCheck className="h-5 w-5" />,
  'Weekly family meal plans': <CalendarCheck className="h-5 w-5" />,
  'Weekend event orders': <Sparkles className="h-5 w-5" />,
  'Bulk snack packs': <ShoppingBag className="h-5 w-5" />,
  'Weekly healthy meal plans': <CalendarCheck className="h-5 w-5" />,
  'Custom celebration cakes': <CakeSlice className="h-5 w-5" />,
}

export default function StorefrontServices({ name, services }: StorefrontServicesProps) {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="WHAT WE OFFER"
        title="Services & experiences"
        subtitle={`Ways you can enjoy ${name}.`}
      />

      {services.length === 0 ? (
        <div className="rounded-2xl border border-[#ece7e1] bg-white">
          <EmptyState
            icon={<Store className="h-8 w-8 text-primary" />}
            title="No services listed yet"
            description="This restaurant will share its available services soon."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service}
              className="flex items-center gap-3 rounded-2xl border border-[#ece7e1] bg-white px-5 py-[22px] transition-colors duration-200 hover:border-primary-100 hover:bg-primary-50/50"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary">
                {SERVICE_ICONS[service] ?? <Sparkles className="h-5 w-5" />}
              </span>
              <span className="text-[14px] font-semibold text-[#262626]">{service}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}