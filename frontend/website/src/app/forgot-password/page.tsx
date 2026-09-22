'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { authService } from '@/lib/services/auth.service'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentResult, setSentResult] = useState<{ email: string; resetToken?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    const result = await authService.requestPasswordReset(email)
    setLoading(false)
    if (result.sent) {
      setSentResult({ email: email.trim(), resetToken: result.resetToken })
    } else {
      setError('We could not find an account with that email address.')
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-md mx-auto container-padding py-12 lg:py-16 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-3">Reset your password</h1>
          <p className="text-muted">
            Enter the email associated with your account and we will send you a reset link.
          </p>
        </div>

        {sentResult ? (
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm ring-1 ring-border-warm/50">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <h2 className="text-xl font-bold text-charcoal mb-2">Reset link sent</h2>
              <p className="text-sm text-muted">
                Follow the link we sent to <span className="font-medium">{sentResult.email}</span> to
                create a new password.
              </p>
              {sentResult.resetToken && (
                <Link
                  href={`/reset-password?token=${sentResult.resetToken}`}
                  className="mt-5 text-sm text-primary font-medium hover:underline"
                >
                  Continue to reset password (dev link)
                </Link>
              )}
              <Link
                href="/login"
                className="mt-4 w-full text-center text-muted text-sm hover:text-primary"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm ring-1 ring-border-warm/50">
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
              <span>{loading ? 'Sending link...' : 'Send reset link'}</span>
            </Button>

            <p className="mt-6 text-center text-sm text-muted">
              Remembered it now?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </main>
      <Footer />
    </div>
  )
}