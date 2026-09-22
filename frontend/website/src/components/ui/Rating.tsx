import React from 'react'
import { Star } from 'lucide-react'

interface RatingProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

const sizes = {
  sm: { star: 'w-3.5 h-3.5', text: 'text-xs' },
  md: { star: 'w-4 h-4', text: 'text-sm' },
  lg: { star: 'w-5 h-5', text: 'text-base' },
}

export default function Rating({ value, size = 'md', showValue = true }: RatingProps) {
  const clamped = Math.max(0, Math.min(5, value))
  const dimensions = sizes[size]

  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rated ${clamped.toFixed(1)} out of 5`}>
      <span className="flex items-center">
        {[1, 2, 3, 4, 5].map((position) => {
          const fill = Math.max(0, Math.min(1, clamped - (position - 1)))
          return (
            <span key={position} className="relative inline-flex">
              <Star className={`${dimensions.star} text-gray-200`} fill="currentColor" strokeWidth={0} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${dimensions.star} text-amber-400`} fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          )
        })}
      </span>
      {showValue && <span className={`${dimensions.text} font-medium text-charcoal`}>{clamped.toFixed(1)}</span>}
    </span>
  )
}