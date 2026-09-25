export const ACCESS_COOKIE = 'lunchup_access'
export const REFRESH_COOKIE = 'lunchup_refresh'

export type CookieEnv = { isProd: boolean }

export function cookieBase(isProd: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
  }
}

export function accessCookieMaxAge(ttlSeconds: number) {
  return Math.max(60, ttlSeconds)
}

export function refreshCookieMaxAge(ttlSeconds: number) {
  return Math.max(60, ttlSeconds)
}

/** Parses an expiresIn string like '15m', '7d', '30d' into seconds. */
export function ttlToSeconds(expiresIn: string): number {
  const match = /^(\d+)(s|m|h|d|w)$/.exec(expiresIn.trim())
  if (!match) return 3600
  const n = parseInt(match[1], 10)
  const unit = match[2]
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 }
  return n * (multipliers[unit] || 1)
}