'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { User, Mail, Lock, Phone, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAuth } from '@/lib/auth/auth-context'

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, isAuthenticated } = useAuth()

  const redirect = searchParams.get('redirect') || '/order'

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Please enter your full name')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address')
      return
    }
    if (!form.phone.trim()) {
      setError('Please enter your phone number')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    setIsLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })
      setSuccess(true)
      router.push(redirect)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account right now.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthenticated && success) {
    router.push(redirect)
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-orange-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center container-padding py-12">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-lg mb-4">
              <span className="text-white font-bold text-2xl">L</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-charcoal mb-2">Create Your Account</h1>
            <p className="text-muted">Join LunchUp and start ordering delicious meals today</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-strong ring-1 ring-border-warm/50">
            {success && (
              <div className="mb-6 flex items-start gap-3 text-sm text-green-700 bg-green-50 rounded-xl p-4 border border-green-200">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="font-medium">Account created successfully! Redirecting...</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-charcoal mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={update('name')}
                      placeholder="Your full name"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="block text-sm font-semibold text-charcoal mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      placeholder="+233 ..."
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-charcoal mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={update('password')}
                      placeholder="At least 8 characters"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-charcoal mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      id="confirm-password"
                      type="password"
                      value={form.confirmPassword}
                      onChange={update('confirmPassword')}
                      placeholder="Re-enter password"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-3 text-sm text-red-600 bg-red-50 rounded-xl p-4 border border-red-100"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-5">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-2 border-border-warm text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                  />
                  <span className="text-sm text-muted group-hover:text-charcoal transition-colors">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary font-medium hover:text-primary-600 transition-colors">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary font-medium hover:text-primary-600 transition-colors">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              <Button type="submit" variant="primary" fullWidth size="lg" disabled={isLoading} className="mt-6 shadow-lg">
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
              </Button>
            </form>
          </div>

          {/* Login Link */}
          <p className="mt-6 text-center text-muted">
            Already have an account?{' '}
            <Link
              href={`/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect') as string)}` : ''}`}
              className="text-primary font-semibold hover:text-primary-600 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
