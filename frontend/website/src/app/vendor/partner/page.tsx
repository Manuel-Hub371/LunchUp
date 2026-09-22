import type { Metadata } from 'next'
import Link from 'next/link'
import SimplePage from '@/components/layout/SimplePage'
import { Store, ClipboardList, PackageCheck, ArrowRight } from 'lucide-react'
import React from 'react'

export const metadata: Metadata = {
  title: 'Partner Program | LunchUp',
  description: 'Explore LunchUp\u2019s partner program for restaurants and food businesses ready to grow with a delivery marketplace.',
  alternates: { canonical: '/vendor/partner' },
}

const steps = [
  {
    icon: Store,
    title: '1. Sign Up',
    body: 'Register your business and tell us about your menu and location.',
  },
  {
    icon: ClipboardList,
    title: '2. Get Verified',
    body: 'We verify your business and quality standards before you go live.',
  },
  {
    icon: PackageCheck,
    title: '3. Start Selling',
    body: 'Launch your menu, receive orders and grow with LunchUp.',
  },
]

export default function VendorPartnerPage() {
  return (
    <SimplePage
      title="LunchUp Partner Program"
      description="A partnership built for local restaurants and food businesses."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div key={step.title} className="bg-warm-50 rounded-2xl p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-semibold text-lg text-charcoal mb-2">{step.title}</h2>
              <p className="text-muted text-sm">{step.body}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/vendor/register"
          className="inline-flex items-center space-x-2 bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <span>Apply to the Partner Program</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </SimplePage>
  )
}