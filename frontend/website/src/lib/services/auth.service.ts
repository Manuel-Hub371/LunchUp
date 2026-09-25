/**
 * Auth service (customer).
 *
 * Sessions are HTTP-only cookies issued by the LunchUp API. The browser
 * never sees the tokens; the service keeps only a lightweight user cache so
 * the UI can render instantly, then validates the cookie session through
 * `GET /auth/me` on startup.
 *
 * Register / login / refresh / logout all persist or clear the cookie on
 * the API side; this module mirrors the resulting user into the cache.
 */
import { ApiError, request } from './api'

const USER_CACHE_KEY = 'lunchup.session.v1'

export interface CustomerUser {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
}

export interface Session {
  user: CustomerUser
}

function readCachedUser(): CustomerUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    return raw ? (JSON.parse(raw) as CustomerUser) : null
  } catch {
    return null
  }
}

function writeCachedUser(user: CustomerUser): void {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
  } catch {
    /* storage unavailable */
  }
}

function clearCachedUser(): void {
  try {
    localStorage.removeItem(USER_CACHE_KEY)
  } catch {
    /* storage unavailable */
  }
}

export const authService = {
  async register(input: {
    name: string
    email: string
    phone?: string
    password: string
  }): Promise<Session> {
    const payload = await request<{ user: CustomerUser }>('/auth/register', {
      method: 'POST',
      body: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        password: input.password,
      },
    })
    writeCachedUser(payload.user)
    return { user: payload.user }
  },

  async login(email: string, password: string): Promise<Session> {
    const payload = await request<{ user: CustomerUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    writeCachedUser(payload.user)
    return { user: payload.user }
  },

  /** Validates the cookie against the API, refreshing the cached user. */
  async fetchSession(): Promise<Session | null> {
    try {
      const user = await request<CustomerUser>('/auth/me')
      writeCachedUser(user)
      return { user }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) clearCachedUser()
      return null
    }
  },

  /** Rotates the refresh token into a fresh session cookie set. */
  async refreshSession(): Promise<Session | null> {
    try {
      const payload = await request<{ user: CustomerUser }>('/auth/refresh', { method: 'POST' })
      writeCachedUser(payload.user)
      return { user: payload.user }
    } catch {
      return null
    }
  },

  /** Cached user for instant render (validity is confirmed by fetchSession). */
  getSession(): Session | null {
    const user = readCachedUser()
    return user ? { user } : null
  },

  async logout(): Promise<void> {
    try {
      await request<{ message: string }>('/auth/logout', { method: 'POST' })
    } catch {
      /* best effort — clear the local cache regardless */
    }
    clearCachedUser()
  },

  async requestPasswordReset(email: string): Promise<{ sent: boolean; resetToken?: string }> {
    return request<{ sent: boolean; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
  },

  async resetPassword(token: string, password: string): Promise<boolean> {
    await request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    })
    return true
  },

  /** Seeded accounts live in the API — nothing to do client-side. */
  ensureDemoAccount(): void {
    /* no-op */
  },

  persistSession(session: Session): void {
    writeCachedUser(session.user)
  },
}