'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Mail, Lock, Loader2, AlertCircle, Info } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAuth } from '@/lib/auth/auth-context'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated } = useAuth()

  const redirect = searchParams.get('redirect') || '/order'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      router.push(redirect)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.')
    } finally {
      setLoading(false)
    }
  }

  if (isAuthenticated) {
    router.push(redirect)
    return null
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-md mx-auto container-padding py-12 lg:py-16 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-3">Welcome back</h1>
          <p className="text-muted">Sign in to continue ordering</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm ring-1 ring-border-warm/50">
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-charcoal">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-5 bg-primary-50 border border-primary-100 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted">
              Demo account: <span className="font-medium">demo@lunchup.com</span> /{' '}
              <span className="font-medium">lunchup123</span>
            </p>
          </div>

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>{loading ? 'Signing in...' : 'Sign in'}</span>
          </Button>

          <p className="mt-6 text-center text-sm text-muted">
            New to LunchUp?{' '}
            <Link href={`/register${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect') as string)}` : ''}`} className="text-primary font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  )
}