import type { Metadata } from 'next'
import SimplePage from '@/components/layout/SimplePage'
import { Shield, Lock, Eye } from 'lucide-react'
import React from 'react'

export const metadata: Metadata = {
  title: 'Privacy Policy | LunchUp',
  description: 'How LunchUp collects, uses and protects your personal information.',
  alternates: { canonical: '/privacy' },
}

const sections = [
  {
    icon: Lock,
    title: '1. What We Collect',
    body: 'We collect the information you provide when creating an account, placing an order, or contacting support. This includes your name, contact details, delivery address and order history.',
  },
  {
    icon: Eye,
    title: '2. How We Use It',
    body: 'Your information is used to process orders, arrange deliveries, provide customer support, and improve our service. We may send you promotional updates if you subscribe to our newsletter — you can opt out at any time.',
  },
  {
    icon: Shield,
    title: '3. How We Protect It',
    body: 'We follow industry-standard security practices to protect your data. We never sell your personal information to third parties, and payments are handled by secure, PCI-compliant partners.',
  },
]

export default function PrivacyPage() {
  return (
    <SimplePage
      title="Privacy Policy"
      description="Your privacy matters to us"
    >
      <div className="space-y-8">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <section key={section.title} className="bg-warm-50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-charcoal">{section.title}</h2>
              </div>
              <p className="text-muted leading-relaxed">{section.body}</p>
            </section>
          )
        })}
      </div>
    </SimplePage>
  )
}