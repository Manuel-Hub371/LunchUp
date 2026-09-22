import type { Metadata } from 'next'
import Link from 'next/link'
import SimplePage from '@/components/layout/SimplePage'
import { Users, ClipboardList, TrendingUp, BarChart3, ArrowRight } from 'lucide-react'
import React from 'react'

export const metadata: Metadata = {
  title: 'Become a Vendor | LunchUp',
  description: 'Grow your restaurant with LunchUp. Reach more customers, manage orders and track performance from one dashboard.',
  alternates: { canonical: '/vendor/info' },
}

const benefits = [
  {
    icon: Users,
    title: 'Reach New Customers',
    body: 'Put your menu in front of thousands of hungry people in your neighbourhood.',
  },
  {
    icon: ClipboardList,
    title: 'Manage Orders Easily',
    body: 'Accept and manage orders from a simple, dedicated dashboard.',
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Business',
    body: 'Turn occasional customers into regulars with deals and promotions.',
  },
  {
    icon: BarChart3,
    title: 'Track Performance',
    body: 'Follow your sales, ratings and reviews in real time.',
  },
]

export default function VendorInfoPage() {
  return (
    <SimplePage
      title="Grow Your Restaurant With LunchUp"
      description="Reach more customers, manage your orders, and grow your business."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {benefits.map((benefit) => {
          const Icon = benefit.icon
          return (
            <div key={benefit.title} className="bg-warm-50 rounded-2xl p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-semibold text-lg text-charcoal mb-2">{benefit.title}</h2>
              <p className="text-muted text-sm">{benefit.body}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-10 bg-gradient-to-br from-primary to-orange-600 text-white rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to start growing?</h2>
        <p className="text-orange-100 mb-6">
          Joining LunchUp takes just a few minutes. Getting started is free.
        </p>
        <Link
          href="/vendor/register"
          className="inline-flex items-center space-x-2 bg-white text-primary font-semibold px-6 py-3 rounded-lg hover:bg-warm-100 transition-colors"
        >
          <span>Become a Vendor</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </SimplePage>
  )
}