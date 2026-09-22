import type { Metadata } from 'next'
import SimplePage from '@/components/layout/SimplePage'
import ContactForm from '@/components/forms/ContactForm'
import { Mail, MessageCircle, Clock } from 'lucide-react'
import React from 'react'

export const metadata: Metadata = {
  title: 'Contact Us | LunchUp',
  description: 'Get in touch with the LunchUp team for help, feedback or partnership enquiries.',
  alternates: { canonical: '/contact' },
}

const channels = [
  {
    icon: Mail,
    title: 'Email',
    value: 'hello@lunchup.com',
    href: 'mailto:hello@lunchup.com',
  },
  {
    icon: MessageCircle,
    title: 'Support',
    value: 'Use the form below for the fastest response',
    href: undefined,
  },
  {
    icon: Clock,
    title: 'Support Hours',
    value: 'Every day, 8:00 AM - 11:00 PM (GMT)',
    href: undefined,
  },
]

export default function ContactPage() {
  return (
    <SimplePage
      title="Contact Us"
      description="We would love to hear from you"
    >
      <div className="grid gap-6 sm:grid-cols-3 mb-10">
        {channels.map((channel) => {
          const Icon = channel.icon
          return (
            <a
              key={channel.title}
              href={channel.href}
              className={`block bg-warm-50 rounded-2xl p-6 text-center ${
                channel.href ? 'hover:shadow-lg transition-shadow' : 'cursor-default'
              }`}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-semibold text-charcoal mb-1">{channel.title}</h2>
              <p className="text-muted text-sm">{channel.value}</p>
            </a>
          )
        })}
      </div>

      <ContactForm />
    </SimplePage>
  )
}