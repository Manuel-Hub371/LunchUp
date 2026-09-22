import type { Metadata } from 'next'
import SimplePage from '@/components/layout/SimplePage'
import { Clock, Store, Shield, BadgePercent } from 'lucide-react'
import React from 'react'

export const metadata: Metadata = {
  title: 'FAQ | LunchUp',
  description: 'Frequently asked questions about ordering and delivering food with LunchUp.',
  alternates: { canonical: '/faq' },
}

const faqs = [
  {
    icon: Clock,
    q: 'How long does delivery take?',
    a: 'Delivery times vary by vendor and location, and are shown on every food card before you order. Most deliveries arrive within 30 to 50 minutes.',
  },
  {
    icon: Store,
    q: 'Which vendors are on LunchUp?',
    a: 'LunchUp works with verified local restaurants and food businesses across the platform. You can browse them all on the Restaurants page.',
  },
  {
    icon: BadgePercent,
    q: 'How do deals and discounts work?',
    a: 'Some foods carry a limited-time discount, shown as a percentage off the original price. Look for the Today\'s Deals section to find the latest offers.',
  },
  {
    icon: Shield,
    q: 'Is my payment information secure?',
    a: 'Yes. Payments are processed by secure, PCI-compliant partners and your full card details are never stored by LunchUp.',
  },
]

export default function FaqPage() {
  return (
    <SimplePage
      title="Frequently Asked Questions"
      description="The answers you are probably looking for"
    >
      <div className="space-y-6">
        {faqs.map((faq) => {
          const Icon = faq.icon
          return (
            <section key={faq.q} className="bg-warm-50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-charcoal">{faq.q}</h2>
              </div>
              <p className="text-muted">{faq.a}</p>
            </section>
          )
        })}
      </div>
    </SimplePage>
  )
}