/**
 * Small shared utilities. Intentionally dependency-free.
 */

export function formatPrice(value: number): string {
  const rounded = Math.round(value * 100) / 100
  return `GH₵${Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2)}`
}

export function roundPrice(value: number): number {
  return Math.round(value * 100) / 100
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Deterministic short hash used for cart-line configuration identity. */
export function configKey(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function getDeliveryMinutes(deliveryTime: string): number {
  const first = parseInt(deliveryTime.split('-')[0] || '30', 10)
  return Number.isFinite(first) ? first : 30
}

export function sortByKey<T>(items: T[], key: (item: T) => number, desc = true): T[] {
  return [...items].sort((a, b) => {
    const diff = key(a) - key(b)
    return desc ? -diff : diff
  })
}

/* ------------------------------------------------------------------ *
 * Restaurant open / closed status.
 * ------------------------------------------------------------------ */

export type OpenStatus = 'open' | 'closed' | 'opening_soon'

/** Minutes from now until a "h:mm AM/PM" time today (null when unparseable). */
function minutesUntil(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim())
  if (!match) return null
  let hours = parseInt(match[1], 10) % 12
  if (match[3].toUpperCase() === 'PM') hours += 12
  const minutes = hours * 60 + parseInt(match[2], 10)
  const now = new Date()
  return minutes - (now.getHours() * 60 + now.getMinutes())
}

/**
 * Derives open / closed / opening-soon from the restaurant's data. When the
 * backend already flags `isOpen` it is respected; "Opening soon" is inferred
 * when the venue is closed but reopens within the next hour.
 */
export function getOpenStatus(restaurant: {
  isOpen?: boolean
  opensAt?: string
  closesAt?: string
}): OpenStatus {
  if (restaurant.isOpen !== false) return 'open'
  if (restaurant.opensAt) {
    const mins = minutesUntil(restaurant.opensAt)
    if (mins !== null && mins >= 0 && mins <= 60) return 'opening_soon'
  }
  return 'closed'
}