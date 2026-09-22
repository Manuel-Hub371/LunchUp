'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Info } from 'lucide-react'

const inputClasses =
  'w-full px-4 py-3 border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all'

export default function VendorLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Vendor portal accounts are not connected yet. Honest placeholder copy.
    return
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-md mx-auto container-padding py-12 lg:py-20 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-3">Vendor Login</h1>
          <p className="text-muted">Sign in to your vendor dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm ring-1 ring-border-warm/50"
        >
          <label htmlFor="vendor-login-email" className="block text-sm font-medium text-charcoal mb-2">
            Email
          </label>
          <input
            id="vendor-login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourbusiness.com"
            className={inputClasses}
            autoComplete="email"
          />

          <label htmlFor="vendor-login-password" className="block text-sm font-medium text-charcoal mb-2 mt-5">
            Password
          </label>
          <input
            id="vendor-login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClasses}
            autoComplete="current-password"
          />

          <button
            type="submit"
            className="mt-6 w-full bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Sign In
          </button>

          <p
            className="mt-5 inline-flex items-start space-x-2 text-sm text-muted bg-warm-50 rounded-lg p-3"
            role="status"
          >
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span>
              The vendor portal is being connected to an account system. In the meantime, request
              access through the{' '}
              <Link href="/vendor/register" className="text-primary font-medium hover:underline">
                registration page
              </Link>
              .
            </span>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  )
}