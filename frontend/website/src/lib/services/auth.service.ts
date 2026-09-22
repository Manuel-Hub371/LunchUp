/**
 * Auth service (customer).
 *
 * DEVELOPMENT: accounts and sessions are stored in localStorage so the full
 * auth journey (register → login → forgot → reset) is real and testable in
 * a browser. When the LunchUp API exists, swap these internals for the
 * account endpoints. Passwords are NOT secure here and must never hold
 * production credentials.
 */
import { ApiError, withLatency } from './api'
import { uid } from '@/lib/utils'

const USERS_KEY = 'lunchup.users.v1'
const SESSION_KEY = 'lunchup.session.v1'

export interface CustomerUser {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
}

interface StoredCustomer extends CustomerUser {
  password: string
}

export interface Session {
  token: string
  user: CustomerUser
}

function readUsers(): StoredCustomer[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredCustomer[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredCustomer[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    /* storage unavailable */
  }
}

function hashPassword(password: string): string {
  /* Non-cryptographic dev hashing. Replace with server-side hashing. */
  let hash = 0
  for (let i = 0; i < password.length; i += 1) {
    hash = (hash << 5) - hash + password.charCodeAt(i)
    hash |= 0
  }
  return `dev-${hash}`
}

function toPublic(user: StoredCustomer): CustomerUser {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt }
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const authService = {
  async register(input: {
    name: string
    email: string
    phone?: string
    password: string
  }): Promise<Session> {
    await withLatency(null)
    const email = input.email.trim().toLowerCase()
    if (!input.name.trim()) throw new ApiError('Please enter your full name.', 422)
    if (!emailRegex.test(email)) throw new ApiError('Please enter a valid email address.', 422)
    if (input.password.length < 8) throw new ApiError('Password must be at least 8 characters.', 422)
    const users = readUsers()
    if (users.some((user) => user.email === email)) {
      throw new ApiError('An account with this email already exists.', 409)
    }
    const stored: StoredCustomer = {
      id: uid('user'),
      name: input.name.trim(),
      email,
      phone: input.phone?.trim() || undefined,
      password: hashPassword(input.password),
      createdAt: new Date().toISOString(),
    }
    users.push(stored)
    writeUsers(users)
    const session = { token: uid('tok'), user: toPublic(stored) }
    this.persistSession(session)
    return session
  },

  async login(email: string, password: string): Promise<Session> {
    await withLatency(null)
    const normalized = email.trim().toLowerCase()
    const user = readUsers().find(
      (stored) => stored.email === normalized && stored.password === hashPassword(password)
    )
    if (!user) throw new ApiError('Invalid email or password.', 401)
    const session = { token: uid('tok'), user: toPublic(user) }
    this.persistSession(session)
    return session
  },

  /** Seeds a demo customer so /login is usable before registration exists. */
  ensureDemoAccount(): void {
    const users = readUsers()
    if (!users.some((user) => user.email === 'demo@lunchup.com')) {
      users.push({
        id: 'user-demo',
        name: 'Demo Customer',
        email: 'demo@lunchup.com',
        phone: '+233 24 000 0000',
        password: hashPassword('lunchup123'),
        createdAt: new Date().toISOString(),
      })
      writeUsers(users)
    }
  },

  persistSession(session: Session): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch {
      /* storage unavailable */
    }
  },

  getSession(): Session | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? (JSON.parse(raw) as Session) : null
    } catch {
      return null
    }
  },

  logout(): void {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* storage unavailable */
    }
  },

  async requestPasswordReset(email: string): Promise<{ sent: boolean; resetToken?: string }> {
    await withLatency(null)
    const normalized = email.trim().toLowerCase()
    const user = readUsers().find((stored) => stored.email === normalized)
    if (!user) {
      // Do not reveal whether an account exists.
      return { sent: false }
    }
    const token = uid('reset')
    try {
      const pending: Record<string, string> = JSON.parse(localStorage.getItem('lunchup.reset.v1') || '{}')
      pending[token] = user.id
      localStorage.setItem('lunchup.reset.v1', JSON.stringify(pending))
    } catch {
      /* storage unavailable */
    }
    return { sent: true, resetToken: token }
  },

  async resetPassword(token: string, password: string): Promise<boolean> {
    await withLatency(null)
    if (password.length < 8) throw new ApiError('Password must be at least 8 characters.', 422)
    try {
      const pending: Record<string, string> = JSON.parse(localStorage.getItem('lunchup.reset.v1') || '{}')
      const userId = pending[token]
      if (!userId) {
        throw new ApiError('This reset link is invalid or has expired.', 400)
      }
      const users = readUsers()
      const user = users.find((stored) => stored.id === userId)
      if (!user) throw new ApiError('This reset link is invalid or has expired.', 400)
      user.password = hashPassword(password)
      writeUsers(users)
      delete pending[token]
      localStorage.setItem('lunchup.reset.v1', JSON.stringify(pending))
      return true
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Unable to reset your password right now.', 500)
    }
  },
}