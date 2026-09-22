import React from 'react'
import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  compact?: boolean
}

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  compact = false,
}: QuantityStepperProps) {
  const size = compact ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <div className="inline-flex items-center rounded-xl border border-border-warm bg-white overflow-hidden shadow-subtle">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${size} flex items-center justify-center text-[#171717] transition-colors hover:bg-warm-100 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span
        aria-live="polite"
        className="min-w-10 px-2 text-center font-bold font-jakarta text-[#171717] text-sm tabular-nums"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`${size} flex items-center justify-center text-[#171717] transition-colors hover:bg-warm-100 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}