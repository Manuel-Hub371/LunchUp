/**
 * Payment architecture.
 *
 * UI components never decide whether a payment succeeded. Payment flows
 * through an initiated → pending → verified lifecycle driven by a payment
 * provider. This module implements the provider adapter contract so a real
 * provider (Mobile Money gateway, card processor) can be dropped in later
 * without touching checkout UI.
 *
 * The development provider simulates the full lifecycle and is clearly not
 * a production payment processor.
 */
import { withLatency, ApiError } from '@/lib/services/api'
import { orderService } from '@/lib/orders/order.service'
import { uid } from '@/lib/utils'
import type { Order, Payment, PaymentMethod, PaymentStatus } from '@/types'

/* ---------------------- Provider contract ----------------------- */

export interface PaymentInitiation {
  reference: string
  provider: string
  status: PaymentStatus
  instructions?: string
}

export interface PaymentProvider {
  /** Starts a payment with the provider. Always begins in `pending`. */
  initiate(input: { amount: number; method: PaymentMethod; account?: string }): Promise<PaymentInitiation>
  /** Asks the provider for the authoritative result of a payment. */
  verify(reference: string): Promise<Exclude<PaymentStatus, 'pending'>>
}

/* --------------------- Development provider ---------------------- */

/**
 * Development provider.
 *
 * Deterministic simulation:
 * - Payments initiated with an account whose last 4 digits are "0000" fail.
 * - Everything else succeeds on the first verification.
 * - Provider responses are authoritative here — the UI just reflects them.
 */
export const devPaymentOutcome: { mode: 'success' | 'fail' | 'expire' } = { mode: 'success' }

const referenceAccounts = new Map<string, string>()

function simulateProviderWork(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 900))
}

const DevPaymentProvider: PaymentProvider = {
  async initiate({ amount, method, account }) {
    await simulateProviderWork()
    const reference = uid('PAY')
    referenceAccounts.set(reference, account || '')
    const instructions =
      method === 'mobile_money'
        ? 'Confirm the payment prompt on your phone to authorize the charge.'
        : 'Complete the secure card checkout to authorize the charge.'
    return { reference, provider: 'dev-shell', status: 'pending', instructions }
  },

  async verify(reference) {
    await simulateProviderWork()
    if (devPaymentOutcome.mode === 'expire') {
      referenceAccounts.delete(reference)
      return 'expired'
    }
    if (devPaymentOutcome.mode === 'fail') {
      referenceAccounts.delete(reference)
      return 'failed'
    }
    const account = referenceAccounts.get(reference) || ''
    referenceAccounts.delete(reference)
    return account.slice(-4) === '0000' ? 'failed' : 'success'
  },
}

/* ------------------------- Payment service ------------------------ */

const PAYMENTS_KEY = 'lunchup.payments.v1'

function readPayments(): Payment[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY)
    return raw ? (JSON.parse(raw) as Payment[]) : []
  } catch {
    return []
  }
}

function writePayments(payments: Payment[]): void {
  try {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
  } catch {
    /* storage unavailable */
  }
}

export const paymentService = {
  provider: DevPaymentProvider,

  async createPayment(order: Order, method: PaymentMethod, account?: string): Promise<Payment> {
    if (method === 'pay_on_delivery') {
      throw new ApiError('Pay-on-delivery orders do not require a payment.', 422)
    }
    await withLatency(null)
    const items = readPayments()
    const existing = items.find((payment) => payment.orderId === order.id)
    if (existing && existing.status === 'pending') return existing

    const initiation = await this.provider.initiate({ amount: order.total, method, account })
    const payment: Payment = {
      id: uid('payment'),
      orderId: order.id,
      method,
      amount: order.total,
      status: initiation.status,
      reference: initiation.reference,
      createdAt: new Date().toISOString(),
    }
    items.push(payment)
    writePayments(items)
    return payment
  },

  /**
   * Verifies a payment with the provider and only marks the order paid when
   * the provider confirms success. On success the order is advanced to
   * `confirmed`.
   */
  async verifyPayment(paymentId: string): Promise<{ payment: Payment; order?: Order }> {
    await withLatency(null, 400)
    const payments = readPayments()
    const payment = payments.find((item) => item.id === paymentId)
    if (!payment) throw new ApiError('Payment not found.', 404)

    const outcome = await this.provider.verify(payment.reference)
    payment.status = outcome
    payment.updatedAt = new Date().toISOString()
    writePayments(payments)

    if (outcome === 'success') {
      const order = await orderService.confirmOrder(payment.orderId)
      return { payment, order: order || undefined }
    }
    return { payment }
  },

  async getByOrder(orderId: string): Promise<Payment | null> {
    await withLatency(null)
    return readPayments().find((payment) => payment.orderId === orderId) || null
  },

  /** Customer-initiated cancellation. Also cancels the related order. */
  async cancelPayment(paymentId: string): Promise<boolean> {
    await withLatency(null)
    const payments = readPayments()
    const payment = payments.find((item) => item.id === paymentId)
    if (!payment || payment.status === 'success' || payment.status === 'failed' || payment.status === 'expired') {
      return false
    }
    payment.status = 'cancelled'
    payment.updatedAt = new Date().toISOString()
    writePayments(payments)
    await orderService.markCancelled(payment.orderId)
    return true
  },
}