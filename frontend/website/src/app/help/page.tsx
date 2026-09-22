import type { Metadata } from 'next'
import SimplePage from '@/components/layout/SimplePage'
import { Mail, ShoppingBag, MapPin, CreditCard } from 'lucide-react'
import React from 'react'

export const metadata: Metadata = {
  title: 'Help & Support | LunchUp',
  description: 'Get help with ordering, payments and delivery on LunchUp.',
  alternates: { canonical: '/help' },
}

const topics = [
  {
    icon: ShoppingBag,
    title: 'How do I place an order?',
    body: 'Search for a food or restaurant, choose your meal, add it to your cart and check out. Your order is confirmed once a vendor accepts it.',
  },
  {
    icon: MapPin,
    title: 'Where do you deliver?',
    body: 'We deliver across multiple locations and neighbourhoods. Your delivery time is shown before you place an order.',
  },
  {
    icon: CreditCard,
    title: 'What payment methods are accepted?',
    body: 'We support secure card payments and other payment methods at checkout wherever available.',
  },
  {
    icon: Mail,
    title: 'Still need help?',
    body: 'Reach our support team through the contact page — we respond quickly and are happy to help.',
  },
]

export default function HelpPage() {
  return (
    <SimplePage
      title="Help & Support"
      description="Answers to common questions about using LunchUp"
    >
      <div className="space-y-6">
        {topics.map((topic) => {
          const Icon = topic.icon
          return (
            <section key={topic.title} className="bg-warm-50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-charcoal">{topic.title}</h2>
              </div>
              <p className="text-muted">{topic.body}</p>
            </section>
          )
        })}
      </div>
    </SimplePage>
  )
}