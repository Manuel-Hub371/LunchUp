import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  label?: string
  compact?: boolean
}

export default function LoadingState({ label = 'Loading...', compact = false }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 ${
        compact ? 'py-8' : 'py-20'
      }`}
    >
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  )
}