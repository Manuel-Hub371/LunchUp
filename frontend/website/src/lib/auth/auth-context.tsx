'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authService, type CustomerUser, type Session } from '@/lib/services/auth.service'

interface AuthContextValue {
  user: CustomerUser | null
  isAuthenticated: boolean
  hydrated: boolean
  login: (email: string, password: string) => Promise<CustomerUser>
  register: (input: { name: string; email: string; phone?: string; password: string }) => Promise<CustomerUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    authService.ensureDemoAccount()
    setSession(authService.getSession())
    setHydrated(true)
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const login: AuthContextValue['login'] = async (email, password) => {
      const next = await authService.login(email, password)
      setSession(next)
      return next.user
    }
    const register: AuthContextValue['register'] = async (input) => {
      const next = await authService.register(input)
      setSession(next)
      return next.user
    }
    return {
      user: session?.user || null,
      isAuthenticated: Boolean(session),
      hydrated,
      login,
      register,
      logout: () => {
        authService.logout()
        setSession(null)
      },
    }
  }, [session, hydrated])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}