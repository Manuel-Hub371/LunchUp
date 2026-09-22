import React from 'react'

interface SkeletonProps {
  className?: string
  lines?: number
}

export default function Skeleton({ className = '', lines }: SkeletonProps) {
  if (lines) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className={`animate-pulse rounded-lg bg-warm-100 ${className}`} />
        ))}
      </div>
    )
  }
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-warm-100 ${className}`} />
}