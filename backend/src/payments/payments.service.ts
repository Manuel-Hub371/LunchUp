import { Injectable } from '@nestjs/common'
import { PaymentMethod } from '@prisma/client'
import { ApiException } from '../common/api-exception'
import { PrismaService } from '../prisma/prisma.service'
import { OrdersService } from '../orders/orders.service'
import { EventsService } from '../realtime/events.service'
import { PaymentInitiateDto, PaymentVerifyDto } from './dto'
import { providerFor } from './providers'

const TERMINAL_PAYMENT_STATUSES = ['FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED']

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly events: EventsService
  ) {}

  private async requireOwnPendingOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { payments: true },
    })
    if (!order) throw ApiException.notFound('NOT_FOUND', 'Order not found.')
    if (order.status !== 'PENDING_PAYMENT') {
      throw ApiException.conflict('INVALID_STATE', 'This order is not awaiting payment.')
    }
    return order
  }

  private methodFor(value: 'mobile_money' | 'card'): PaymentMethod {
    return value === 'card' ? 'CARD' : 'MOBILE_MONEY'
  }

  async initiate(userId: string, dto: PaymentInitiateDto) {
    const order = await this.requireOwnPendingOrder(userId, dto.orderId)
    if (order.paymentMethod === 'PAY_ON_DELIVERY') {
      throw ApiException.conflict('INVALID_STATE', 'Pay-on-delivery orders do not require online payment.')
    }

    const activePayment = order.payments?.find((p) => p.status === 'PENDING' || p.status === 'SUCCESS')
    if (activePayment) {
      return {
        paymentId: activePayment.id,
        orderId: order.id,
        reference: activePayment.reference,
        provider: activePayment.provider,
        requiresVerification: activePayment.status === 'PENDING',
        status: activePayment.status,
      }
    }

    const provider = providerFor(this.methodFor(dto.method))
    const init = {
      amount: order.total,
      orderNumber: order.number,
      method: this.methodFor(dto.method),
      details: dto.details ?? {},
    }
    const created = await provider.purchase(init)

    await this.prisma.$transaction(async (tx) => {
      if (order.payments[0] && TERMINAL_PAYMENT_STATUSES.includes(order.payments[0].status)) {
        await tx.payment.delete({ where: { id: order.payments[0].id } })
      }
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: this.methodFor(dto.method),
          amount: order.total,
          status: 'PENDING',
          reference: created.reference,
          provider: created.provider,
          providerReference: created.providerReference,
          accountMasked: created.accountMasked,
        },
      })
    })

    return {
      paymentId: await this.findPaymentId(order.id),
      orderId: order.id,
      reference: created.reference,
      provider: created.provider,
      requiresVerification: created.requiresVerification,
      status: 'PENDING',
    }
  }

  async verify(userId: string, dto: PaymentVerifyDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
      include: { payments: true },
    })
    if (!order) throw ApiException.notFound('NOT_FOUND', 'Order not found.')

    const payment = order.payments?.find((p) => p.reference === dto.reference)
    if (!payment) throw ApiException.notFound('NOT_FOUND', 'Payment not found for this order.')

    if (payment.status === 'SUCCESS') {
      const view = await this.orders.markPaid(order.id)
      return { orderId: order.id, paymentId: payment.id, status: 'success', order: view }
    }
    if (payment.status !== 'PENDING') {
      throw ApiException.conflict('INVALID_STATE', `This payment is already ${payment.status.toLowerCase()}.`)
    }

    const provider = providerFor(payment.method)
    const result = await provider.verify(dto.reference, {
      amount: payment.amount,
      orderNumber: order.number,
      method: payment.method,
    })

    if (result.status === 'success') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS', accountMasked: result.accountMasked },
      })
      const view = await this.orders.markPaid(order.id, 'Payment verified')
      await this.events.notify(order.userId, {
        type: 'ORDER_UPDATE',
        title: `Payment received for ${order.number}`,
        body: 'Your payment was successful.',
        data: { orderId: order.id },
      })
      return { orderId: order.id, paymentId: payment.id, status: 'success', order: view }
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        errorMessage: result.message ?? 'The payment provider rejected this transaction.',
        accountMasked: result.accountMasked,
      },
    })
    await this.events.notify(order.userId, {
      type: 'ORDER_UPDATE',
      title: `Payment failed for ${order.number}`,
      body: result.message ?? 'Your payment could not be completed. Please try again.',
      data: { orderId: order.id },
    })
    return { orderId: order.id, paymentId: payment.id, status: 'failed', message: result.message }
  }

  private async findPaymentId(orderId: string): Promise<string> {
    const payment = await this.prisma.payment.findFirst({ where: { orderId }, select: { id: true } })
    if (!payment) throw ApiException.notFound('NOT_FOUND', 'Payment not found.')
    return payment.id
  }
}