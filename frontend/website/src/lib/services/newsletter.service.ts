/**
 * Newsletter service.
 *
 * Development fallback persists subscriptions to localStorage so the
 * "already subscribed" state is honest within a browser. Swap internals
 * for the real subscription API when available.
 */
import { withLatency } from './api'

const STORAGE_KEY = 'lunchup.newsletter.v1'

function readSubscriptions(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function writeSubscriptions(set: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)))
  } catch {
    /* storage unavailable — session-only behaviour */
  }
}

export type NewsletterResult =
  | { status: 'subscribed' }
  | { status: 'already_subscribed' }
  | { status: 'invalid' }

export const newsletterService = {
  async subscribe(email: string): Promise<NewsletterResult> {
    const value = email.trim().toLowerCase()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    if (!valid) {
      return withLatency({ status: 'invalid' })
    }
    await withLatency(null)
    const subscriptions = readSubscriptions()
    if (subscriptions.has(value)) {
      return { status: 'already_subscribed' }
    }
    subscriptions.add(value)
    writeSubscriptions(subscriptions)
    return { status: 'subscribed' }
  },
}