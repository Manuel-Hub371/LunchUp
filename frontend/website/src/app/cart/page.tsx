'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import EmptyState from '@/components/ui/EmptyState'
import QuantityStepper from '@/components/ui/QuantityStepper'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '@/lib/cart/cart-context'
import { formatPrice } from '@/lib/utils'
import { validateCartLines } from '@/lib/cart/cart-utils'

export default function CartPage() {
  const { lines, hydrated, updateQuantity, removeLine, subtotal } = useCart()
  const [dismissed, setDismissed] = useState<string[]>([])

  const validation = useMemo(() => (hydrated ? validateCartLines(lines) : null), [lines, hydrated])
  const visibleIssues = useMemo(
    () => (validation ? validation.issues.filter((issue) => !issue.resolved) : []),
    [validation]
  )
  const honoredLines = validation?.lines || []
  const shownIssues = visibleIssues.filter((issue) => !dismissed.includes(issue.key))

  const deliveryEstimate = 10
  const estimateTotal = Math.round((subtotal + deliveryEstimate) * 100) / 100

  const dismissIssue = (key: string) => {
    setDismissed((prev) => [...prev, key])
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-warm-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto container-padding py-12 lg:py-20">
          <div className="animate-pulse bg-warm-100 rounded-xl h-48" />
        </main>
        <Footer />
      </div>
    )
  }

  if (honoredLines.length === 0) {
    return (
      <div className="min-h-screen bg-warm-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto container-padding py-12 lg:py-20">
          <EmptyState
            icon={<ShoppingBag className="w-10 h-10 text-primary" />}
            title="Your cart is empty"
            description="Add some delicious food to your cart to get started"
            actionLabel="Browse Food"
            actionHref="/order"
          />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-orange-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto container-padding py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-charcoal mb-2">Shopping Cart</h1>
          <p className="text-muted">
            {honoredLines.length} {honoredLines.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {shownIssues.length > 0 && (
          <div className="mb-6 space-y-2" role="alert">
            {shownIssues.map((issue) => (
              <div
                key={issue.key}
                className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
              >
                <p className="text-sm text-amber-800">{issue.message}</p>
                <button
                  type="button"
                  onClick={() => dismissIssue(issue.key)}
                  className="text-xs font-medium text-amber-700 hover:underline shrink-0"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {honoredLines.map((line) => (
              <div
                key={line.key}
                className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all ring-1 ring-border-warm/50"
              >
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={line.food.image}
                      alt={line.food.name}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg text-charcoal mb-1">
                          <Link
                            href={`/food/${line.food.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {line.food.name}
                          </Link>
                        </h3>
                        <p className="text-sm text-muted mb-2">{line.food.vendor}</p>
                        {line.selections.length > 0 && (
                          <div className="text-sm text-muted mb-2 space-y-0.5">
                            {line.selections.map((selection) => {
                              const group = line.food.customizationGroups?.find(
                                (g) => g.id === selection.groupId
                              )
                              const optionNames = selection.optionIds
                                .map((id) => group?.options.find((o) => o.id === id)?.name)
                                .filter(Boolean)
                              if (optionNames.length === 0) return null
                              return (
                                <p key={selection.groupId}>
                                  <span className="font-medium">{group?.name}: </span>
                                  {(optionNames as string[]).join(', ')}
                                </p>
                              )
                            })}
                          </div>
                        )}
                        {line.specialInstructions && (
                          <p className="text-sm text-muted italic">
                            Note: {line.specialInstructions}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeLine(line.key)}
                        className="text-red-500 hover:text-red-600 p-2 -mr-2"
                        aria-label={`Remove ${line.food.name} from cart`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <QuantityStepper
                        compact
                        value={line.quantity}
                        onChange={(next) => updateQuantity(line.key, next - line.quantity)}
                      />
                      <div className="text-right">
                        <p className="text-xl font-bold text-charcoal">
                          {formatPrice(line.unitPrice * line.quantity)}
                        </p>
                        {line.quantity > 1 && (
                          <p className="text-sm text-muted">{formatPrice(line.unitPrice)} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-strong ring-1 ring-border-warm/50 sticky top-24">
              <h2 className="text-xl font-bold text-charcoal mb-6">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Delivery estimate</span>
                  <span>{formatPrice(deliveryEstimate)}</span>
                </div>
              </div>

              <p className="text-xs text-muted mb-4">
                Final delivery fee and any coupon discounts are applied at checkout.
              </p>

              <div className="border-t border-border-warm pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-charcoal">Total</span>
                  <span className="text-3xl font-bold text-primary">{formatPrice(estimateTotal)}</span>
                </div>
                <p className="text-xs text-muted text-right">Including estimated delivery</p>
              </div>

              <Link
                href="/checkout"
                className="block w-full text-center bg-gradient-primary text-white font-semibold px-6 py-4 rounded-xl hover:shadow-glow transition-all inline-flex items-center justify-center gap-2 shadow-md"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/order"
                className="block w-full text-center text-primary font-medium px-6 py-3 mt-3 hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}