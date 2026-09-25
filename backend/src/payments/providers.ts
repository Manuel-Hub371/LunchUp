import { createHash } from 'crypto'
import { Logger } from '@nestjs/common'
import { PaymentMethod } from '@prisma/client'

export interface PaymentInit {
  amount: number
  orderNumber: string
  method: PaymentMethod
  details?: Record<string, string>
}

export interface PaymentReference {
  reference: string
  providerReference: string
  provider: string
  requiresVerification: boolean
  accountMasked?: string
}

export interface VerificationResult {
  status: 'success' | 'failed'
  accountMasked?: string
  message?: string
}

export interface PaymentProvider {
  purchase(init: PaymentInit): Promise<PaymentReference>
  verify(reference: string, init: PaymentInit): Promise<VerificationResult>
}

const logger = new Logger('PaymentProvider')

function makeReference(prefix: string, seed: string): string {
  return `${prefix}-${createHash('sha1').update(seed + Date.now()).digest('hex').slice(0, 12).toUpperCase()}`
}

function maskAccount(account: string): string {
  const clean = account.replace(/\D/g, '')
  if (clean.length <= 4) return `****${clean}`
  return `****${clean.slice(-4)}`
}

/**
 * Sandbox mobile money gateway. Only used in development/tests (and as the
 * default when no live gateway credentials are configured). It deliberately
 * fails any account whose last 4 digits are `0000`, so "fake success" is
 * impossible by accident — failure paths are exercised exactly like in
 * production. Swap `purchase`/`verify` with a real MoMo PSP to go live.
 *
 * The sandbox keeps the payment `details` on the provider keyed by reference
 * so `verify(reference)` can replay the original context (production PSPs
 * store this server-side too). Instances are singletons created lazily in
 * `providerFor`.
 */
export class SandboxMobileMoneyProvider implements PaymentProvider {
  readonly provider = 'sandbox_momo'
  private readonly pending = new Map<string, PaymentInit>()

  async purchase(init: PaymentInit): Promise<PaymentReference> {
    const account = init.details?.accountNumber || '0000000000'
    const reference = makeReference('MOMO', `${init.method}-${account}`)
    this.pending.set(reference, init)
    logger.debug(`Sandbox MoMo purchase initiated for order ${init.orderNumber}`)
    return {
      reference,
      providerReference: `sbx_momo_${reference}`,
      provider: this.provider,
      requiresVerification: true,
      accountMasked: maskAccount(account),
    }
  }

  async verify(reference: string, init: PaymentInit): Promise<VerificationResult> {
    const stored = this.pending.get(reference)
    const account = stored?.details?.accountNumber || init.details?.accountNumber || '0000000000'
    if (stored) this.pending.delete(reference)
    const last4 = account.replace(/\D/g, '').slice(-4)
    if (last4 === '0000') {
      return { status: 'failed', accountMasked: maskAccount(account), message: 'The payment provider rejected this account.' }
    }
    return { status: 'success', accountMasked: maskAccount(account) }
  }
}

/** Sandbox card gateway with the same contract and failure rules. */
export class SandboxCardProvider implements PaymentProvider {
  readonly provider = 'sandbox_card'
  private readonly pending = new Map<string, PaymentInit>()

  async purchase(init: PaymentInit): Promise<PaymentReference> {
    const card = init.details?.cardLast4 || '0000'
    const reference = makeReference('CARD', `${init.method}-${card}`)
    this.pending.set(reference, init)
    logger.debug(`Sandbox card purchase initiated for order ${init.orderNumber}`)
    return {
      reference,
      providerReference: `sbx_card_${reference}`,
      provider: this.provider,
      requiresVerification: true,
      accountMasked: `****${card}`,
    }
  }

  async verify(reference: string, init: PaymentInit): Promise<VerificationResult> {
    const stored = this.pending.get(reference)
    const card = stored?.details?.cardLast4 || init.details?.cardLast4 || '0000'
    if (stored) this.pending.delete(reference)
    if (card.replace(/\D/g, '') === '0000') {
      return { status: 'failed', accountMasked: `****${card}`, message: 'The payment provider rejected this card.' }
    }
    return { status: 'success', accountMasked: `****${card}` }
  }
}

/** Pay-on-delivery: no provider interaction; collected on delivery. */
export class PayOnDeliveryProvider implements PaymentProvider {
  readonly provider = 'pay_on_delivery'

  async purchase(init: PaymentInit): Promise<PaymentReference> {
    return {
      reference: makeReference('POD', `$pod-${init.orderNumber}`),
      providerReference: `pod_${init.orderNumber}`,
      provider: this.provider,
      requiresVerification: false,
    }
  }

  async verify(_reference: string): Promise<VerificationResult> {
    return { status: 'success' }
  }
}

const momoProvider = new SandboxMobileMoneyProvider()
const cardProvider = new SandboxCardProvider()
const podProvider = new PayOnDeliveryProvider()

export function providerFor(method: PaymentMethod): PaymentProvider {
  switch (method) {
    case 'MOBILE_MONEY':
      return momoProvider
    case 'CARD':
      return cardProvider
    case 'PAY_ON_DELIVERY':
      return podProvider
  }
}