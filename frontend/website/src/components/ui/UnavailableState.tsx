import React from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import Button from './Button'

interface UnavailableStateProps {
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
}

export default function UnavailableState({
  title = 'Currently unavailable',
  description = 'This item is not available for orders right now. Please check back shortly.',
  actionLabel,
  actionHref,
}: UnavailableStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-12 border border-dashed border-border-warm rounded-2xl bg-warm-50">
      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
        <Clock className="w-7 h-7 text-muted" />
      </div>
      <h3 className="text-base font-semibold text-charcoal">{title}</h3>
      <p className="text-sm text-muted max-w-sm">{description}</p>
      {actionLabel && actionHref && (
        <div className="mt-1">
          <Link href={actionHref}>
            <Button variant="outline" size="sm">
              {actionLabel}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}