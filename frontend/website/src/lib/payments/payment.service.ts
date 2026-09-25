/**
 * Payment service.
 *
 * UI components never decide whether a payment succeeded; the LunchUp API
 * owns the provider lifecycle. This module adapts checkout + the payment
 * page to `/payments/initiate` and `/payments/verify`.
 *
 * A lightweight in-memory index keyed by `paymentId` preserves the session
 * across the client-side navigation from checkout to the payment page and
 * enables an automatic retry when the previous attempt reached a terminal
 * state. It is re-watered from the order whenever the page loads.
 */
import { ApiError, request } from '@/lib/services/api'
import { orderService, toOrder, type OrderView } from '@/lib/orders/order.service'
import type { Order, Payment, PaymentMethod } from '@/types'

interface InitiatedPayment {
  paymentId: string
  orderId: string
  reference: string
  method: PaymentMethod
  amount: number
}

const initiatedByPaymentId = new Map<string, InitiatedPayment>()

interface InitiateResponse {
  paymentId: string
  orderId: string
  reference: string
  provider: string
  requiresVerification: boolean
  status: string
}

interface VerifyResponse {
  orderId: string
  paymentId: string
  status: 'success' | 'failed'
  message?: string
  order?: OrderView
}

function toPayment(paymentId: string, base: InitiatedPayment): Payment {
  return {
    id: paymentId,
    orderId: base.orderId,
    method: base.method,
    amount: base.amount,
    status: 'pending',
    reference: base.reference,
    createdAt: new Date().toISOString(),
  }
}

function statusFor(raw: string): Payment['status'] {
  const normalized = (raw || '').toLowerCase()
  if (normalized === 'success') return 'success'
  if (normalized === 'failed') return 'failed'
  if (normalized === 'expired') return 'expired'
  if (normalized === 'cancelled') return 'cancelled'
  return 'pending'
}

export const paymentService = {
  async createPayment(order: Order, method: PaymentMethod, account?: string): Promise<Payment> {
    if (method === 'pay_on_delivery') {
      throw new ApiError('Pay-on-delivery orders do not require a payment.', 422)
    }
    const details = method === 'mobile_money' ? { accountNumber: account } : { cardLast4: account }
    const init = await request<InitiateResponse>('/payments/initiate', {
      method: 'POST',
      body: { orderId: order.id, method, details },
    })
    const base: InitiatedPayment = {
      paymentId: init.paymentId,
      orderId: init.orderId,
      reference: init.reference,
      method,
      amount: order.total,
    }
    initiatedByPaymentId.set(init.paymentId, base)
    return toPayment(init.paymentId, base)
  },

  /**
   * Verifies a payment and only reflects the result the API reports. On
   * success the order is returned with payment confirmed. When the previous
   * attempt reached a terminal state the service starts a fresh payment on
   * the same order (server-side) and surfaces `retry` so the page can adopt
   * the new payment id.
   */
  async verifyPayment(paymentId: string, orderId?: string): Promise<{
    payment: Payment
    order?: Order
    retry?: string
  }> {
    const entry = initiatedByPaymentId.get(paymentId)
    const resolvedOrderId = entry?.orderId || orderId
    if (!resolvedOrderId) {
      throw new ApiError('Payment session not found. Please start again.', 404, 'PAYMENT_SESSION_NOT_FOUND')
    }

    let result: VerifyResponse
    try {
      result = await request<VerifyResponse>('/payments/verify', {
        method: 'POST',
        body: { orderId: resolvedOrderId, reference: entry?.reference },
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && entry) {
        const fresh = await request<InitiateResponse>('/payments/initiate', {
          method: 'POST',
          body: { orderId: entry.orderId, method: entry.method, details: {} },
        })
        const base: InitiatedPayment = {
          paymentId: fresh.paymentId,
          orderId: entry.orderId,
          reference: fresh.reference,
          method: entry.method,
          amount: entry.amount,
        }
        initiatedByPaymentId.set(fresh.paymentId, base)
        const order = await orderService.getById(entry.orderId)
        return { payment: toPayment(fresh.paymentId, base), order: order || undefined, retry: fresh.paymentId }
      }
      throw error
    }

    const order = result.order ? toOrder(result.order) : ((await orderService.getById(result.orderId)) ?? undefined)
    const payment: Payment = {
      id: result.paymentId,
      orderId: result.orderId,
      method: entry?.method ?? order?.paymentMethod ?? 'mobile_money',
      amount: entry?.amount ?? order?.total ?? 0,
      status: statusFor(result.status),
      reference: entry?.reference ?? '',
      createdAt: new Date().toISOString(),
    }
    if (result.status === 'success') {
      initiatedByPaymentId.delete(paymentId)
    }
    return { payment, order }
  },

  /** Rebuilds the payment session from the order's stored payment row. */
  async getByOrder(orderIdOrPaymentId: string): Promise<Payment | null> {
    const order = await orderService.getById(orderIdOrPaymentId)
    if (!order || !order.paymentId) return null
    const base: InitiatedPayment = {
      paymentId: order.paymentId,
      orderId: order.id,
      reference: order.paymentReference ?? '',
      method: order.paymentMethod,
      amount: order.total,
    }
    initiatedByPaymentId.set(order.paymentId, base)
    return {
      id: order.paymentId,
      orderId: order.id,
      method: order.paymentMethod,
      amount: order.total,
      status: statusFor(order.paymentStatus),
      reference: order.paymentReference ?? '',
      createdAt: order.createdAt,
    }
  },

  /** Customer-initiated cancellation. Also cancels the related order. */
  async cancelPayment(paymentId: string, orderId?: string): Promise<boolean> {
    const entry = initiatedByPaymentId.get(paymentId)
    const resolvedOrderId = entry?.orderId || orderId
    if (!resolvedOrderId) return false
    const cancelled = await orderService.markCancelled(resolvedOrderId)
    initiatedByPaymentId.delete(paymentId)
    return Boolean(cancelled)
  },
}