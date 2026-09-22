'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { CheckCircle2, Circle, MapPin, Smartphone, CreditCard, Banknote, RefreshCcw } from 'lucide-react'
import { orderService } from '@/lib/orders/order.service'
import { formatPrice } from '@/lib/utils'
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  orderStatusIndex,
  isCancelled,
  isDelivered,
  formatOrderDate,
} from '@/lib/orders/order-utils'
import type { Order, OrderStatus } from '@/types'

export default function TrackOrderDetailPage({ params }: { params: { orderId: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const result = await orderService.getById(params.orderId)
    setOrder(result)
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto container-padding py-12 lg:py-16">
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
            actionLabel="Find an order"
            actionHref="/track"
          />
        </main>
        <Footer />
      </div>
    )
  }

  const cancelled = isCancelled(order.status)
  const delivered = isDelivered(order.status)
  const currentIndex = cancelled ? -1 : orderStatusIndex(order.status)
  const payIcon =
    order.paymentMethod === 'mobile_money' ? (
      <Smartphone className="w-4 h-4" />
    ) : order.paymentMethod === 'card' ? (
      <CreditCard className="w-4 h-4" />
    ) : (
      <Banknote className="w-4 h-4" />
    )

  const simulateStep = async () => {
    const next = await orderService.simulateOrderProgress(order.id)
    if (next) setOrder(next)
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto container-padding py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-charcoal">Order {order.number}</h1>
            <p className="text-muted text-sm">Placed on {formatOrderDate(order.createdAt)}</p>
          </div>
          <Link href="/order">
            <Button variant="outline" size="sm">
              Order more food
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {/* 404 style status */}
          {cancelled ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-border-warm/50">
              <h2 className="text-xl font-bold text-charcoal mb-2">This order was cancelled</h2>
              <p className="text-muted mb-4">
                No payment was processed for this order. If you still want your meal, place a new
                order.
              </p>
              <Link href="/order">
                <Button>Order again</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-border-warm/50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg font-bold text-charcoal">Delivery status</h2>
                  <p className="text-sm text-muted">{ORDER_STATUS_LABELS[order.status]}</p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  ETA {order.estimatedDeliveryTime}
                </span>
              </div>

              <ol className="relative border-l-2 border-border-warm space-y-6 ml-2">
                {ORDER_STATUS_FLOW.map((status) => {
                  const index = ORDER_STATUS_FLOW.indexOf(status)
                  const done = index <= currentIndex
                  const active = index === currentIndex
                  return (
                    <li key={status} className="relative pl-8">
                      <span
                        className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          done ? 'bg-primary' : 'bg-white border-2 border-border-warm'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <Circle className="w-3 h-3 text-gray-300" />
                        )}
                      </span>
                      <p
                        className={`text-sm font-medium ${
                          active ? 'text-primary' : done ? 'text-charcoal' : 'text-muted'
                        }`}
                      >
                        {ORDER_STATUS_LABELS[status]}
                      </p>
                      {active && (
                        <p className="text-xs text-muted">In progress right now</p>
                      )}
                    </li>
                  )
                })}
              </ol>

              {!delivered && !cancelled && (
                <div className="mt-8 flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl p-4">
                  <RefreshCcw className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-sm text-gray-700 flex-1">
                    Development demo: advance this order to the next status to preview the tracking
                    experience.
                  </p>
                  <Button size="sm" variant="outline" onClick={simulateStep}>
                    Next step
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Payment status */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-border-warm/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {payIcon}
                <p className="font-medium text-charcoal">Payment</p>
              </div>
              <span
                className={`text-sm font-semibold ${
                  order.paymentStatus === 'success' ? 'text-green-600' : 'text-amber-600'
                }`}
              >
                {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </span>
            </div>
            <p className="text-sm text-muted mt-2">
              {formatPrice(order.total)} via{' '}
              {order.paymentMethod === 'mobile_money'
                ? 'Mobile Money'
                : order.paymentMethod === 'card'
                  ? 'Card'
                  : 'Pay on Delivery'}
            </p>
          </div>

          {/* Delivery address */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-border-warm/50">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-primary" />
              <p className="font-medium text-charcoal">Delivering to</p>
            </div>
            <p className="text-sm text-muted">
              {order.deliveryAddress.name} · {order.deliveryAddress.phone}
            </p>
            <p className="text-sm text-muted">
              {order.deliveryAddress.address}
              {order.deliveryAddress.landmark ? ` (${order.deliveryAddress.landmark})` : ''},{' '}
              {order.deliveryAddress.city}
            </p>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-border-warm/50">
            <h2 className="text-lg font-bold text-charcoal mb-4">Order items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.foodId} className="flex items-start justify-between gap-4">
                  <p className="text-sm text-muted">
                    {item.foodName} <span className="text-muted">× {item.quantity}</span>
                  </p>
                  <p className="text-sm font-medium text-charcoal">{formatPrice(item.lineTotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border-warm flex justify-between font-semibold text-charcoal">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}