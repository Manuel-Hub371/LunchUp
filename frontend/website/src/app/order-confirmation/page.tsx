'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import {
  CheckCircle2,
  Clock,
  MapPin,
  Smartphone,
  CreditCard,
  Banknote,
  Copy,
} from 'lucide-react'
import { orderService } from '@/lib/orders/order.service'
import { formatPrice } from '@/lib/utils'
import { formatOrderDate } from '@/lib/orders/order-utils'
import type { Order } from '@/types'

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading your order..." />}>
      <OrderConfirmationContent />
    </Suspense>
  )
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    if (!orderId) {
      setLoading(false)
      return
    }
    void orderService.getById(orderId).then((result) => {
      if (!active) return
      setOrder(result)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto container-padding py-12 lg:py-20">
          <LoadingState label="Loading your order..." />
        </main>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-warm-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto container-padding py-12 lg:py-20">
          <EmptyState
            title="Order not found"
            description="We could not find this order. Check the order number and try again."
            actionLabel="Track an order"
            actionHref="/track"
          />
        </main>
        <Footer />
      </div>
    )
  }

  const payLabel =
    order.paymentMethod === 'mobile_money'
      ? 'Mobile Money'
      : order.paymentMethod === 'card'
        ? 'Credit / Debit Card'
        : 'Pay on Delivery'

  const payIcon =
    order.paymentMethod === 'mobile_money' ? (
      <Smartphone className="w-4 h-4" />
    ) : order.paymentMethod === 'card' ? (
      <CreditCard className="w-4 h-4" />
    ) : (
      <Banknote className="w-4 h-4" />
    )

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.number)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto container-padding py-12 lg:py-16">
        <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-border-warm/50">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-charcoal mb-2">
              {order.paymentMethod === 'pay_on_delivery' ? 'Order placed!' : 'Payment successful!'}
            </h1>
            <p className="text-muted">Thank you — your order is confirmed and being prepared.</p>

            <div className="inline-flex items-center gap-2 mt-4 bg-primary-50 border border-primary-100 rounded-full px-4 py-2">
              <span className="text-sm text-muted">Order number</span>
              <span className="font-bold text-charcoal">{order.number}</span>
              <button
                type="button"
                onClick={copyNumber}
                aria-label="Copy order number"
                className="p-1 text-muted hover:text-primary transition-colors"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Status summary */}
          <div className="bg-warm-50 rounded-xl p-5 mb-6 grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted">Estimated delivery</p>
                <p className="font-medium text-charcoal text-sm">{order.estimatedDeliveryTime}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted">Delivering to</p>
                <p className="font-medium text-charcoal text-sm leading-snug">
                  {order.deliveryAddress.address}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                {payIcon}
              </div>
              <div>
                <p className="text-xs text-muted">Payment</p>
                <p className="font-medium text-charcoal text-sm">{payLabel}</p>
                <p className="text-xs text-green-600">{order.paymentStatus === 'success' ? 'Paid' : 'Pending'}</p>
              </div>
            </div>
          </div>

          {/* Order items */}
          <h2 className="text-lg font-bold text-charcoal mb-4">Order summary</h2>
          <div className="border-t border-border-warm divide-y divide-border-warm">
            {order.items.map((item) => (
              <div key={item.foodId} className="py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-charcoal">
                    {item.foodName} <span className="text-muted">× {item.quantity}</span>
                  </p>
                  {item.selections.length > 0 && (
                    <p className="text-sm text-muted">
                      {item.selections.map((selection) => selection.optionNames.join(', ')).join(', ')}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-charcoal">{formatPrice(item.lineTotal)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-border-warm pt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted">
              <span>Delivery</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-charcoal pt-2">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted mt-4">
            Placed on {formatOrderDate(order.createdAt)}
          </p>
        </div>

        {/* Next steps */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href={`/track/${order.id}`} className="flex-1">
            <Button className="w-full">Track your order</Button>
          </Link>
          <Link href="/order" className="flex-1">
            <Button variant="outline" className="w-full">
              Order more food
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}