'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { authService } from '@/lib/services/auth.service'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  )
}

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError('This reset link is missing or invalid.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset your password right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-md mx-auto container-padding py-12 lg:py-16 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-3">Choose a new password</h1>
          <p className="text-muted">Your new password must be at least 8 characters.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm ring-1 ring-border-warm/50">
          {done ? (
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <h2 className="text-xl font-bold text-charcoal mb-2">Password updated</h2>
              <p className="text-sm text-muted mb-6">
                You can now sign in with your new password.
              </p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className="w-full pl-11 pr-4 py-3 border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-charcoal mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
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

              <Button type="submit" className="w-full mt-6" disabled={loading}>
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                <span>{loading ? 'Updating...' : 'Update password'}</span>
              </Button>

              <p className="mt-6 text-center text-sm text-muted">
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}