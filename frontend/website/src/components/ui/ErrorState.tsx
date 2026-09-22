import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export default function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this page. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center text-center gap-3 py-16 px-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-1">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h3 className="font-jakarta text-xl font-bold text-[#171717]">{title}</h3>
      <p className="text-sm text-muted max-w-md leading-relaxed">{description}</p>
      {onRetry && (
        <div className="mt-3">
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}