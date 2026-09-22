import type { Metadata } from 'next'
import SimplePage from '@/components/layout/SimplePage'
import { MapPin, CreditCard, RefreshCw } from 'lucide-react'
import React from 'react'

export const metadata: Metadata = {
  title: 'Terms of Service | LunchUp',
  description: 'The terms and conditions that govern your use of the LunchUp marketplace and delivery services.',
  alternates: { canonical: '/terms' },
}

const sections = [
  {
    icon: MapPin,
    title: '1. The Service',
    body: 'LunchUp is a marketplace that connects customers with independent food vendors and arranges delivery of prepared meals. When you place an order, you are contracting with the vendor for the food and with LunchUp for the delivery service.',
  },
  {
    icon: CreditCard,
    title: '2. Payments',
    body: 'Prices displayed include all applicable charges unless stated otherwise. Payment is required at checkout. We work with secure payment partners and never store your full card details on our servers.',
  },
  {
    icon: RefreshCw,
    title: '3. Cancellations & Refunds',
    body: 'You may cancel an order before the vendor begins preparing it. If an order cannot be fulfilled, you will receive a full refund. Refund requests are reviewed in accordance with our support policy.',
  },
]

export default function TermsPage() {
  return (
    <SimplePage
      title="Terms of Service"
      description="Last updated: January 2024"
    >
      <div className="space-y-8">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <section key={section.title} className="bg-warm-50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-charcoal">{section.title}</h2>
              </div>
              <p className="text-muted leading-relaxed">{section.body}</p>
            </section>
          )
        })}
      </div>
    </SimplePage>
  )
}