'use client'

import React, { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import LoadingState from '@/components/ui/LoadingState'
import ErrorState from '@/components/ui/ErrorState'
import Button from '@/components/ui/Button'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Smartphone,
  CreditCard,
  ShieldCheck,
} from 'lucide-react'
import { paymentService } from '@/lib/payments/payment.service'
import { orderService } from '@/lib/orders/order.service'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/lib/cart/cart-context'
import type { Order, Payment } from '@/types'

type Phase =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'pending'; payment: Payment; order: Order }
  | { kind: 'verifying'; payment: Payment; order: Order }
  | { kind: 'success'; payment: Payment; order: Order }
  | { kind: 'failed'; payment: Payment; order: Order }
  | { kind: 'expired'; payment: Payment; order: Order }
  | { kind: 'cancelled'; order: Order }
  | { kind: 'error'; message: string }

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading payment..." />}>
      <PaymentPageContent />
    </Suspense>
  )
}

function PaymentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clear } = useCart()
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [attemptedVerify, setAttemptedVerify] = useState(false)

  const paymentId = searchParams.get('paymentId')
  const orderId = searchParams.get('orderId')

  const load = useCallback(async () => {
    if (!paymentId) {
      setPhase({ kind: 'missing' })
      return
    }
    try {
      const payment = await paymentService.getByOrder(orderId || paymentId)
      if (!payment) {
        setPhase({ kind: 'missing' })
        return
      }
      const order = (await orderService.getById(payment.orderId)) as Order | null
      if (!order) {
        setPhase({ kind: 'missing' })
        return
      }

      if (payment.status === 'success' || order.paymentStatus === 'success') {
        clear()
        router.replace(`/order-confirmation?orderId=${order.id}`)
        return
      } else if (payment.status === 'failed') {
        setPhase({ kind: 'failed', payment, order })
      } else if (payment.status === 'expired') {
        setPhase({ kind: 'expired', payment, order })
      } else if (payment.status === 'cancelled') {
        setPhase({ kind: 'cancelled', order })
      } else {
        setPhase({ kind: 'pending', payment, order })
      }
    } catch {
      setPhase({ kind: 'error', message: 'We could not load your payment. Please try again.' })
    }
  }, [paymentId, orderId, clear, router])

  const verify = useCallback(async () => {
    setPhase((current) => {
      if (current.kind === 'pending' || current.kind === 'failed' || current.kind === 'expired') {
        return { kind: 'verifying', payment: current.payment, order: current.order }
      }
      return current
    })
    try {
      const result = await paymentService.verifyPayment(paymentId as string, orderId || undefined)
      if (result.retry) {
        router.replace(`/payment?paymentId=${result.retry}&orderId=${orderId || ''}`)
        setAttemptedVerify(true)
        load()
        return
      }
      if (result.payment.status === 'success' && result.order) {
        clear()
        router.replace(`/order-confirmation?orderId=${result.order.id}`)
        return
      }
      const payment = result.payment
      const order = (await orderService.getById(payment.orderId)) as Order | null
      if (!order) {
        setPhase({ kind: 'missing' })
        return
      }
      if (payment.status === 'failed') setPhase({ kind: 'failed', payment, order })
      else if (payment.status === 'expired') setPhase({ kind: 'expired', payment, order })
      else setPhase({ kind: 'pending', payment, order })
    } catch (error) {
      setPhase({
        kind: 'error',
        message: error instanceof Error ? error.message : 'We could not verify your payment right now.',
      })
    }
  }, [paymentId, orderId, clear, router, load])

  const cancelPayment = async () => {
    try {
      await paymentService.cancelPayment(paymentId as string, orderId || undefined)
      const order = (await orderService.getById(orderId || '')) as Order | null
      if (order) setPhase({ kind: 'cancelled', order })
      else setPhase({ kind: 'missing' })
    } catch {
      setPhase({ kind: 'error', message: 'We could not cancel the payment. Please try again.' })
    }
  }

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (phase.kind === 'pending' && !attemptedVerify) {
      const timer = window.setTimeout(() => {
        setAttemptedVerify(true)
        void verify()
      }, 3200)
      return () => window.clearTimeout(timer)
    }
  }, [phase.kind, attemptedVerify, verify])

  if (phase.kind === 'loading') {
    return (
      <div className="min-h-screen bg-warm-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto container-padding py-12 lg:py-20">
          <LoadingState label="Loading payment..." />
        </main>
        <Footer />
      </div>
    )
  }

  if (phase.kind === 'missing') {
    return (
      <div className="min-h-screen bg-warm-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto container-padding py-12 lg:py-20">
          <ErrorState
            title="Payment not found"
            description="This payment link is invalid or has expired."
          />
          <div className="text-center">
            <Link href="/order">
              <Button variant="outline">Browse food</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (phase.kind === 'error') {
    return (
      <div className="min-h-screen bg-warm-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto container-padding py-12 lg:py-20">
          <ErrorState title="Something went wrong" description={phase.message} onRetry={load} />
        </main>
        <Footer />
      </div>
    )
  }

  if (phase.kind === 'cancelled') {
    return (
      <div className="min-h-screen bg-warm-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto container-padding py-12 lg:py-20">
          <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-border-warm/50 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-muted" />
            </div>
            <h1 className="text-2xl font-bold text-charcoal mb-2">Payment cancelled</h1>
            <p className="text-muted mb-6">
              Order <span className="font-medium text-charcoal">{phase.order.number}</span> has been
              cancelled and no payment was taken.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/checkout">
                <Button>Return to checkout</Button>
              </Link>
              <Link href="/order">
                <Button variant="outline">Browse food</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const { payment, order } = phase

  const payIcon =
    payment.method === 'mobile_money' ? (
      <Smartphone className="w-5 h-5 text-primary" />
    ) : (
      <CreditCard className="w-5 h-5 text-primary" />
    )

  const busy = phase.kind === 'pending' || phase.kind === 'verifying'
  const title =
    phase.kind === 'verifying'
      ? 'Verifying payment...'
      : phase.kind === 'failed'
        ? 'Payment failed'
        : phase.kind === 'expired'
          ? 'Payment expired'
          : `Pay ${formatPrice(payment.amount)}`

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto container-padding py-12 lg:py-20">
        <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-border-warm/50">
          {/* Status icon */}
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                phase.kind === 'failed' || phase.kind === 'expired'
                  ? 'bg-red-50'
                  : 'bg-primary-50'
              }`}
            >
              {phase.kind === 'verifying' ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : phase.kind === 'failed' ? (
                <XCircle className="w-8 h-8 text-red-500" />
              ) : phase.kind === 'expired' ? (
                <AlertCircle className="w-8 h-8 text-amber-500" />
              ) : (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-charcoal mb-2">{title}</h1>
            <p className="text-muted max-w-md">
              {phase.kind === 'verifying'
                ? 'Checking with the payment provider...'
                : phase.kind === 'failed'
                  ? 'Your payment could not be completed. Your order has not been charged.'
                  : phase.kind === 'expired'
                    ? 'This payment could not be completed in time. You can try again with a new payment.'
                    : 'Please approve the payment on your phone to complete your order.'}
            </p>
          </div>

          {/* Payment details */}
          <div className="bg-warm-50 rounded-xl p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted">Amount</span>
              <span className="text-xl font-bold text-charcoal">{formatPrice(payment.amount)}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted">Payment method</span>
              <span className="flex items-center gap-2 text-sm font-medium text-charcoal">
                {payIcon}
                {payment.method.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted">Order</span>
              <span className="text-sm font-medium text-charcoal">{order.number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Reference</span>
              <span className="text-sm font-medium text-charcoal">{payment.reference}</span>
            </div>
          </div>

          {/* Actions */}
          {phase.kind === 'pending' && (
            <Button className="w-full" onClick={() => void verify()}>
              I have approved — check payment
            </Button>
          )}

          {phase.kind === 'verifying' && (
            <p className="text-center text-xs text-muted flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Processing with our payment provider...
            </p>
          )}

          {phase.kind === 'failed' && (
            <>
              <div className="mb-3">
                <Button className="w-full" onClick={() => void verify()}>
                  Retry payment
                </Button>
              </div>
              <Link href="/checkout">
                <Button variant="outline" className="w-full">
                  Choose a different payment method
                </Button>
              </Link>
            </>
          )}

          {phase.kind === 'expired' && (
            <Button className="w-full" onClick={() => void verify()}>
              Retry payment
            </Button>
          )}

          {busy ? (
            <p className="text-center text-xs text-muted mt-3">
              Do not close this page while your payment is being processed.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void cancelPayment()}
              className="mt-4 w-full text-center text-sm text-muted hover:text-red-600 transition-colors"
            >
              Cancel payment and order
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}