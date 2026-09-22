'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import EmptyState from '@/components/ui/EmptyState'
import {
  MapPin,
  Truck,
  CreditCard,
  Smartphone,
  Banknote,
  Tag,
  Loader2,
  AlertCircle,
  X,
  Check,
} from 'lucide-react'
import { useCart } from '@/lib/cart/cart-context'
import { useAuth } from '@/lib/auth/auth-context'
import { formatPrice } from '@/lib/utils'
import { validateCartLines } from '@/lib/cart/cart-utils'
import { orderService, deliveryMethods } from '@/lib/orders/order.service'
import { paymentService } from '@/lib/payments/payment.service'
import { couponService } from '@/lib/services/coupon.service'
import { presetAddresses } from '@/lib/mock-data'
import type { DeliveryAddress, DeliveryMethod, PaymentMethod } from '@/types'

type FormStatus =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'applying' }
  | { kind: 'processing' }

export default function CheckoutPage() {
  const router = useRouter()
  const { lines, hydrated, clear } = useCart()
  const { user, isAuthenticated } = useAuth()

  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: 'Accra',
  })
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('standard')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money')
  const [mobileMoneyAccount, setMobileMoneyAccount] = useState(user?.phone || '')
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; label: string; discount: number } | null>(null)
  const [couponMessage, setCouponMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<FormStatus>({ kind: 'idle' })

  const validation = useMemo(() => (hydrated ? validateCartLines(lines) : null), [lines, hydrated])
  const validLines = useMemo(() => validation?.lines || [], [validation])
  const hasBlockingIssues = useMemo(() => validation?.valid === false, [validation])

  const selectedMethod = deliveryMethods.find((method) => method.id === deliveryMethod) || deliveryMethods[0]
  const deliveryFee = selectedMethod.fee

  const subtotal = useMemo(
    () => Math.round(validLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100) / 100,
    [validLines]
  )
  const discount = appliedCoupon?.discount || 0
  const total = Math.round((subtotal + deliveryFee - discount) * 100) / 100

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

  if (validLines.length === 0) {
    return (
      <div className="min-h-screen bg-warm-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto container-padding py-12 lg:py-20">
          <EmptyState
            title="Nothing to check out"
            description="Your cart is empty. Add some food before you check out."
            actionLabel="Browse Food"
            actionHref="/order"
          />
        </main>
        <Footer />
      </div>
    )
  }

  const applyPreset = (address: DeliveryAddress) => {
    setDeliveryAddress({
      name: address.name,
      phone: address.phone,
      address: address.address,
      landmark: address.landmark,
      city: address.city,
      instructions: address.instructions,
    })
    if (paymentMethod === 'mobile_money' && !mobileMoneyAccount) {
      setMobileMoneyAccount(address.phone)
    }
  }

  const applyCoupon = async () => {
    if (!couponInput.trim()) return
    setStatus({ kind: 'applying' })
    setCouponMessage(null)
    const result = await couponService.validate(couponInput, subtotal)
    if (result.status === 'valid') {
      setAppliedCoupon(result.coupon)
      setCouponInput('')
      setCouponMessage(`Coupon applied — ${result.coupon.label}`)
    } else if (result.status === 'not_eligible') {
      setCouponMessage(result.message)
    } else {
      setCouponMessage('That code is not valid. Please check and try again.')
    }
    setStatus({ kind: 'idle' })
  }

  const placeOrder = async () => {
    setStatus({ kind: 'idle' })

    if (hasBlockingIssues) {
      setStatus({ kind: 'error', message: 'Some items in your cart need attention before you can order. Please review your cart.' })
      return
    }
    if (!deliveryAddress.name.trim()) {
      setStatus({ kind: 'error', message: 'Please enter the recipient name.' })
      return
    }
    if (!deliveryAddress.phone.trim()) {
      setStatus({ kind: 'error', message: 'Please enter a phone number for delivery.' })
      return
    }
    if (!deliveryAddress.address.trim()) {
      setStatus({ kind: 'error', message: 'Please enter your delivery address.' })
      return
    }
    if (paymentMethod === 'mobile_money' && !mobileMoneyAccount.trim()) {
      setStatus({ kind: 'error', message: 'Please enter your mobile money number.' })
      return
    }

    try {
      setStatus({ kind: 'processing' })
      const order = await orderService.createOrder({
        lines: validLines,
        deliveryAddress,
        deliveryMethod,
        paymentMethod,
        couponDiscount: discount,
        couponLabel: appliedCoupon?.label,
      })

      if (paymentMethod === 'pay_on_delivery') {
        clear()
        router.push(`/order-confirmation?orderId=${order.id}`)
        return
      }

      const payment = await paymentService.createPayment(order, paymentMethod, paymentMethod === 'mobile_money' ? mobileMoneyAccount : undefined)
      router.push(`/payment?paymentId=${payment.id}&orderId=${order.id}`)
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unable to place your order right now.',
      })
    }
  }

  const sectionHeader = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center space-x-3 mb-5">
      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">{icon}</div>
      <h2 className="text-xl font-bold text-charcoal">{title}</h2>
    </div>
  )

  const inputClasses =
    'w-full px-4 py-3 border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-charcoal'

  const addressSummary =
    deliveryAddress.address.trim() && deliveryAddress.phone.trim() && deliveryAddress.name.trim()

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto container-padding py-8 lg:py-12">
        <h1 className="text-3xl font-bold text-charcoal mb-2">Checkout</h1>
        <p className="text-muted mb-8">Almost there — confirm your details and place your order.</p>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <section className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-border-warm/50">
              {sectionHeader(<MapPin className="w-5 h-5 text-primary" />, 'Delivery Address')}

              {presetAddresses.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-charcoal mb-2">Saved addresses</p>
                  <div className="flex flex-wrap gap-2">
                    {presetAddresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => applyPreset(address)}
                        className="text-sm border border-border-warm rounded-lg px-3 py-2 text-charcoal hover:border-primary hover:text-primary transition-colors"
                      >
                        {address.address}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={deliveryAddress.name}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, name: e.target.value })}
                    placeholder="Your full name"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-charcoal mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={deliveryAddress.phone}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                    placeholder="+233 ..."
                    className={inputClasses}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-charcoal mb-2">
                    Delivery Address
                  </label>
                  <textarea
                    id="address"
                    value={deliveryAddress.address}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                    placeholder="House number, street name, area..."
                    rows={3}
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                <div>
                  <label htmlFor="landmark" className="block text-sm font-medium text-charcoal mb-2">
                    Landmark (Optional)
                  </label>
                  <input
                    id="landmark"
                    type="text"
                    value={deliveryAddress.landmark || ''}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, landmark: e.target.value })}
                    placeholder="Near a notable building or location"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-charcoal mb-2">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                    placeholder="Accra"
                    className={inputClasses}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="instructions" className="block text-sm font-medium text-charcoal mb-2">
                    Delivery Notes (Optional)
                  </label>
                  <input
                    id="instructions"
                    type="text"
                    value={deliveryAddress.instructions || ''}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, instructions: e.target.value })}
                    placeholder="Leave at gate, call on arrival, etc."
                    className={inputClasses}
                  />
                </div>
              </div>
            </section>

            {/* Delivery Method */}
            <section className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-border-warm/50">
              {sectionHeader(<Truck className="w-5 h-5 text-primary" />, 'Delivery Method')}

              <div className="space-y-3" role="radiogroup" aria-label="Delivery method">
                {deliveryMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      deliveryMethod === method.id
                        ? 'border-primary bg-primary-50'
                        : 'border-border-warm hover:border-primary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery-method"
                        value={method.id}
                        checked={deliveryMethod === method.id}
                        onChange={() => setDeliveryMethod(method.id)}
                        className="text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-medium text-charcoal">{method.label}</p>
                        <p className="text-sm text-muted">
                          {method.eta} · {method.description}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-charcoal">{formatPrice(method.fee)}</p>
                  </label>
                ))}
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-border-warm/50">
              {sectionHeader(<CreditCard className="w-5 h-5 text-primary" />, 'Payment Method')}

              <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    paymentMethod === 'mobile_money'
                      ? 'border-primary bg-primary-50'
                      : 'border-border-warm hover:border-primary'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="mobile_money"
                    checked={paymentMethod === 'mobile_money'}
                    onChange={() => setPaymentMethod('mobile_money')}
                    className="text-primary focus:ring-primary mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-primary" />
                      <p className="font-medium text-charcoal">Mobile Money</p>
                    </div>
                    {paymentMethod === 'mobile_money' && (
                      <input
                        type="tel"
                        value={mobileMoneyAccount}
                        onChange={(e) => setMobileMoneyAccount(e.target.value)}
                        placeholder="+233 ... (mobile money number)"
                        aria-label="Mobile money number"
                        className={`${inputClasses} mt-3`}
                      />
                    )}
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary-50'
                      : 'border-border-warm hover:border-primary'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="text-primary focus:ring-primary"
                  />
                  <CreditCard className="w-5 h-5 text-primary" />
                  <p className="font-medium text-charcoal">Credit / Debit Card</p>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    paymentMethod === 'pay_on_delivery'
                      ? 'border-primary bg-primary-50'
                      : 'border-border-warm hover:border-primary'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="pay_on_delivery"
                    checked={paymentMethod === 'pay_on_delivery'}
                    onChange={() => setPaymentMethod('pay_on_delivery')}
                    className="text-primary focus:ring-primary"
                  />
                  <Banknote className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-charcoal">Pay on Delivery</p>
                    <p className="text-sm text-muted">Pay with cash or mobile money when your order arrives.</p>
                  </div>
                </label>
              </div>
            </section>

            {/* Promo Code */}
            <section className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-border-warm/50">
              {sectionHeader(<Tag className="w-5 h-5 text-primary" />, 'Promo Code')}

              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                      <p className="text-sm text-green-700">{appliedCoupon.label}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null)
                      setCouponMessage(null)
                    }}
                    aria-label="Remove coupon"
                    className="p-1.5 text-green-700 hover:bg-green-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter promo code"
                      aria-label="Promo code"
                      className="flex-1 px-4 py-3 border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={status.kind === 'applying' || !couponInput.trim()}
                      className="px-6 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {status.kind === 'applying' ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  {couponMessage && (
                    <p className="mt-3 text-sm text-muted">{couponMessage}</p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    Try LUNCH10, FIRST20 or FREEDEL.
                  </p>
                </>
              )}
            </section>

            {!isAuthenticated && !user && addressSummary ? (
              <p className="text-xs text-muted px-1">
                Ordering without an account? You can still track this order by its order number.
              </p>
            ) : null}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-border-warm/50 sticky top-24">
              <h2 className="text-xl font-bold text-charcoal mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 pb-4 border-b border-border-warm">
                {validLines.map((line) => (
                  <div key={line.key} className="flex justify-between text-sm">
                    <span className="text-muted">
                      {line.food.name} × {line.quantity}
                    </span>
                    <span className="font-medium text-charcoal">
                      {formatPrice(line.unitPrice * line.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Delivery ({selectedMethod.eta})</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({appliedCoupon?.code})</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-border-warm pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-charcoal">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              {status.kind === 'error' && status.message && (
                <div
                  role="alert"
                  className="mb-4 flex items-start space-x-2 text-sm text-red-600 bg-red-50 rounded-lg p-3"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{status.message}</span>
                </div>
              )}

              {hasBlockingIssues && (
                <div className="mb-4 flex items-start space-x-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Some items in your cart need your attention.{' '}
                    <Link href="/cart" className="font-medium underline">
                      Review cart
                    </Link>
                  </span>
                </div>
              )}

              <button
                onClick={placeOrder}
                disabled={status.kind === 'processing' || status.kind === 'applying'}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3.5 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status.kind === 'processing' && <Loader2 className="w-5 h-5 animate-spin" />}
                <span>
                  {status.kind === 'processing'
                    ? 'Placing order...'
                    : paymentMethod === 'pay_on_delivery'
                      ? 'Place Order'
                      : `Pay ${formatPrice(total)}`}
                </span>
              </button>

              <Link
                href="/cart"
                className="block w-full text-center text-primary font-medium px-6 py-3 mt-3 hover:underline"
              >
                Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}