import type { Metadata } from 'next'
import SimplePage from '@/components/layout/SimplePage'
import { Sparkles, Bike, MapPin } from 'lucide-react'
import React from 'react'

export const metadata: Metadata = {
  title: 'About Us | LunchUp',
  description: 'Learn about LunchUp, the food delivery marketplace connecting you with trusted vendors across Ghana.',
  alternates: { canonical: '/about' },
}

const values = [
  {
    icon: Sparkles,
    title: 'Fresh Food',
    description: 'Every meal is freshly prepared by our trusted vendor partners and delivered with care.',
  },
  {
    icon: Bike,
    title: 'Fast Delivery',
    description: 'Our riders get your food to your door quickly, keeping it hot and fresh.',
  },
  {
    icon: MapPin,
    title: 'Local First',
    description: 'We help local restaurants and small food businesses reach more customers in their community.',
  },
]

export default function AboutPage() {
  return (
    <SimplePage
      title="About LunchUp"
      description="Great food. Better together."
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-charcoal mb-4">Our Story</h2>
          <p className="text-muted leading-relaxed mb-4">
            LunchUp exists to make great local food more accessible. We connect hungry customers with
            trusted vendors in their neighborhood, handling discovery, ordering and delivery so you
            can focus on enjoying your meal.
          </p>
          <p className="text-muted leading-relaxed">
            Whether you are craving a home-style local dish or a quick continental bite, LunchUp brings
            the best of your city to your doorstep.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-charcoal mb-6">What We Stand For</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <div key={value.title} className="bg-warm-50 rounded-2xl p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-charcoal mb-2">{value.title}</h3>
                  <p className="text-muted text-sm">{value.description}</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </SimplePage>
  )
}