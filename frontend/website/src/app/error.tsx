'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-charcoal mb-2">Something went wrong</h1>
        <p className="text-muted text-lg mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center border-2 border-charcoal text-charcoal font-semibold px-6 py-3 rounded-lg hover:bg-charcoal hover:text-white transition-colors"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}