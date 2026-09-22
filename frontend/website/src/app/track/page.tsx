'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import { AlertCircle, MapPin, Truck } from 'lucide-react'
import { orderService } from '@/lib/orders/order.service'

export default function TrackOrderPage() {
  const router = useRouter()
  const [orderRef, setOrderRef] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = orderRef.trim()
    if (!value) {
      setError('Please enter your order number (e.g. LU-XXXXXX).')
      return
    }
    setSearching(true)
    setError(null)
    const order = await orderService.getById(value)
    setSearching(false)
    if (order) {
      router.push(`/track/${order.id}`)
    } else {
      setError('We could not find an order with that number. Please check and try again.')
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto container-padding py-12 lg:py-20">
        <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-border-warm/50">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-charcoal mb-2">Track your order</h1>
            <p className="text-muted">
              Enter your order number to see live updates on your delivery.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="order-ref" className="block text-sm font-medium text-charcoal mb-2">
              Order number
            </label>
            <input
              id="order-ref"
              type="text"
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
              placeholder="LU-XXXXXX"
              aria-label="Order number"
              className="w-full px-4 py-3 border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center font-semibold tracking-widest"
            />
            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" className="w-full mt-5" disabled={searching}>
              {searching ? 'Looking up...' : 'Track order'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border-warm">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted">
                You will find your order number on your order confirmation. You can also track recent
                orders from your account menu.
              </p>
            </div>
            <Link
              href="/"
              className="block w-full text-center text-primary font-medium px-6 py-3 mt-4 hover:underline"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}