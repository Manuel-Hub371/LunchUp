import React from 'react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-8xl font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl lg:text-3xl font-bold text-charcoal mb-3">Page not found</h1>
        <p className="text-muted text-lg mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-primary-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  )
}