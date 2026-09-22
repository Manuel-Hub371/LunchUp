import type { Metadata } from 'next'
import React from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Smartphone, Star, MapPin, Banknote, Bell } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Download the LunchUp App | LunchUp',
  description: 'Get the LunchUp app to order your favorite meals faster — available on iOS and Android.',
  alternates: { canonical: '/download' },
}

const features = [
  {
    icon: MapPin,
    title: 'Order in seconds',
    description: 'Find restaurants near you and reorder your favorites in a tap.',
  },
  {
    icon: Bell,
    title: 'Live order tracking',
    description: 'Follow every order from the kitchen to your doorstep.',
  },
  {
    icon: Star,
    title: 'Exclusive app deals',
    description: 'Unlock app-only offers and early access to new vendors.',
  },
  {
    icon: Banknote,
    title: 'Secure payments',
    description: 'Pay with mobile money, card, or cash on delivery — your choice.',
  },
]

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-charcoal text-white">
          <div className="max-w-7xl mx-auto container-padding py-14 lg:py-20">
            <div className="flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-primary px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide mb-5">
                  <Smartphone className="w-4 h-4" />
                  LunchUp mobile app
                </div>
                <h1 className="text-3xl lg:text-5xl font-bold mb-4">
                  Great food, anywhere you are
                </h1>
                <p className="text-gray-300 text-lg mb-8 max-w-xl">
                  Browse menus, customize your meal, and track your delivery — right from your phone.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <a
                    href="https://apps.apple.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-charcoal rounded-xl px-6 py-3 font-semibold hover:bg-warm-100 transition-colors inline-flex items-center justify-center gap-2"
                    aria-label="Download on the App Store"
                  >
                    <span className="text-xl">Apple</span>
                    <span className="text-xs uppercase text-muted">App Store</span>
                  </a>
                  <a
                    href="https://play.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-charcoal rounded-xl px-6 py-3 font-semibold hover:bg-warm-100 transition-colors inline-flex items-center justify-center gap-2"
                    aria-label="Get it on Google Play"
                  >
                    <span className="text-xl">Google</span>
                    <span className="text-xs uppercase text-muted">Play</span>
                  </a>
                </div>

                <p className="text-xs text-muted mt-4">
                  Free to download. Available on iOS and Android. Store links are placeholders until
                  the apps are published.
                </p>
              </div>

              <div className="relative w-56 lg:w-72 h-80 lg:h-96 bg-cream-50/20 rounded-3xl flex items-center justify-center">
                <span className="text-8xl">🍽️</span>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto container-padding py-14 lg:py-20">
          <h2 className="text-2xl lg:text-3xl font-bold text-charcoal text-center mb-10">
            Why order with the LunchUp app?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-border-warm/50">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-charcoal mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}