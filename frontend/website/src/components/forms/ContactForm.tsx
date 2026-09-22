'use client'

import React, { useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2, Send } from 'lucide-react'
import Button from '../ui/Button'
import { contactService } from '@/lib/services/contact.service'

type Status =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'sending' }
  | { kind: 'sent'; reference: string }

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ kind: 'sending' })
    try {
      const result = await contactService.submit(form)
      setStatus({ kind: 'sent', reference: result.reference })
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unable to send your message right now.',
      })
    }
  }

  if (status.kind === 'sent') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-charcoal mb-2">Message received</h2>
        <p className="text-sm text-muted mb-4">
          Thanks for reaching out. A member of our team will get back to you shortly.
        </p>
        <p className="text-xs text-muted">Reference: {status.reference}</p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => setStatus({ kind: 'idle' })}
        >
          Send another message
        </Button>
      </div>
    )
  }

  const inputClasses =
    'w-full px-4 py-3 border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-charcoal'

  return (
    <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm ring-1 ring-border-warm/50">
      <h2 className="text-xl font-bold text-charcoal mb-5">Send us a message</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-charcoal mb-2">
              Full Name
            </label>
            <input
              id="contact-name"
              type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="Your name"
              className={inputClasses}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-charcoal mb-2">
              Email Address
            </label>
            <input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              className={inputClasses}
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-subject" className="block text-sm font-medium text-charcoal mb-2">
            Subject
          </label>
          <input
            id="contact-subject"
            type="text"
            value={form.subject}
            onChange={update('subject')}
            placeholder="How can we help?"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-charcoal mb-2">
            Message
          </label>
          <textarea
            id="contact-message"
            value={form.message}
            onChange={update('message')}
            placeholder="Tell us more..."
            rows={4}
            className={`${inputClasses} resize-none`}
          />
        </div>

        {status.kind === 'error' && (
          <div
            role="alert"
            className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{status.message}</span>
          </div>
        )}

        <Button type="submit" disabled={status.kind === 'sending'}>
          {status.kind === 'sending' && <Loader2 className="w-5 h-5 animate-spin" />}
          <span>{status.kind === 'sending' ? 'Sending...' : 'Send message'}</span>
        </Button>
      </form>
    </div>
  )
}