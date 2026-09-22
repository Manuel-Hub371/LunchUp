'use client'

import React, { useState } from 'react'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { newsletterService } from '@/lib/services/newsletter.service'

type Message = { type: 'success' | 'error' | 'info'; text: string } | null

export default function NewsletterCTA() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<Message>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsLoading(true)
    const result = await newsletterService.subscribe(email)
    setIsLoading(false)

    if (result.status === 'subscribed') {
      setMessage({
        type: 'success',
        text: 'Thanks for subscribing.',
      })
      setEmail('')
    } else if (result.status === 'already_subscribed') {
      setMessage({
        type: 'info',
        text: 'You are already subscribed.',
      })
    } else {
      setMessage({ type: 'error', text: 'Please enter a valid email address' })
    }
  }

  return (
    <section className="bg-white py-14 md:py-20">
      <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary px-6 py-12 text-center text-white md:px-10 md:py-16">
          <h2 className="font-jakarta mx-auto mb-3 max-w-[560px] text-[28px] font-bold leading-tight tracking-tight md:text-[32px]">
            Get exclusive deals in your inbox
          </h2>
          <p className="mx-auto mb-8 max-w-[480px] text-[15px] leading-relaxed text-white/90">
            Subscribe to receive special offers and restaurant updates.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-[480px] flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
              className="w-full flex-1 rounded-lg px-4 py-3 text-[14px] text-[#171717] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#171717] px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isLoading ? 'Subscribing...' : 'Subscribe'}</span>
            </button>
          </form>

          {message && (
            <p
              className={`mt-4 inline-flex items-center gap-2 text-sm ${
                message.type === 'success'
                  ? 'text-white'
                  : message.type === 'error'
                    ? 'text-red-100'
                    : 'text-yellow-100'
              }`}
              role="status"
            >
              {message.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {message.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{message.text}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
