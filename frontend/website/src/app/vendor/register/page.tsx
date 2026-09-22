'use client'

import React, { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { CheckCircle2, AlertCircle, Loader2, Store } from 'lucide-react'
import { vendorService } from '@/lib/services/vendor.service'

type Status = { type: 'success' | 'error'; text: string } | null

const inputClasses =
  'w-full px-4 py-3 border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all'

export default function VendorRegisterPage() {
  const [form, setForm] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: '',
    location: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)

    if (!form.businessName.trim()) {
      setStatus({ type: 'error', text: 'Please enter your business name' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setStatus({ type: 'error', text: 'Please enter a valid business email' })
      return
    }
    if (form.phone.trim().length < 6) {
      setStatus({ type: 'error', text: 'Please enter a valid phone number' })
      return
    }
    if (!form.businessType) {
      setStatus({ type: 'error', text: 'Please select your business type' })
      return
    }

    setIsLoading(true)

    try {
      await vendorService.submitApplication({
        businessName: form.businessName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        businessType: form.businessType,
        location: form.location,
      })
      setStatus({
        type: 'success',
        text: 'Your application has been received. Our team will reach out within 2 business days.',
      })
      setForm({
        businessName: '',
        contactName: '',
        email: '',
        phone: '',
        businessType: '',
        location: '',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to submit your application right now.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto container-padding py-12 lg:py-16 w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-2xl mb-4">
            <Store className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-charcoal mb-3">Register Your Business</h1>
          <p className="text-muted">
            Join LunchUp and start reaching thousands of customers in your area.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm ring-1 ring-border-warm/50"
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="business-name" className="block text-sm font-medium text-charcoal mb-2">
                Business Name
              </label>
              <input
                id="business-name"
                type="text"
                value={form.businessName}
                onChange={update('businessName')}
                placeholder="e.g. Royal Kitchen"
                className={inputClasses}
                autoComplete="organization"
              />
            </div>

            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-charcoal mb-2">
                Contact Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={form.contactName}
                onChange={update('contactName')}
                placeholder="Your full name"
                className={inputClasses}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="vendor-phone" className="block text-sm font-medium text-charcoal mb-2">
                Phone Number
              </label>
              <input
                id="vendor-phone"
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                placeholder="+233 ..."
                className={inputClasses}
                autoComplete="tel"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="vendor-email" className="block text-sm font-medium text-charcoal mb-2">
                Business Email
              </label>
              <input
                id="vendor-email"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@yourbusiness.com"
                className={inputClasses}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="business-type" className="block text-sm font-medium text-charcoal mb-2">
                Business Type
              </label>
              <select
                id="business-type"
                value={form.businessType}
                onChange={update('businessType')}
                className={inputClasses}
              >
                <option value="">Select a type</option>
                <option value="restaurant">Restaurant</option>
                <option value="fastfood">Fast Food</option>
                <option value="caterer">Caterer</option>
                <option value="snacks">Snacks &amp; Drinks</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="vendor-location" className="block text-sm font-medium text-charcoal mb-2">
                Location
              </label>
              <input
                id="vendor-location"
                type="text"
                value={form.location}
                onChange={update('location')}
                placeholder="e.g. East Legon, Accra"
                className={inputClasses}
                autoComplete="address-level2"
              />
            </div>
          </div>

          {status && (
            <p
              className={`mt-5 inline-flex items-center space-x-2 text-sm ${
                status.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
              role="status"
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{status.text}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full inline-flex items-center justify-center space-x-2 bg-primary text-white font-semibold px-6 py-3.5 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>{isLoading ? 'Submitting...' : 'Submit Application'}</span>
          </button>
        </form>
      </main>
      <Footer />
    </div>
  )
}