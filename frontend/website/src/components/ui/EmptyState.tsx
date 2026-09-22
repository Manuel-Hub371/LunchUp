import React from 'react'
import Link from 'next/link'
import { UtensilsCrossed } from 'lucide-react'
import Button from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
}: EmptyStateProps) {
  const action = actionHref ? (
    <Link href={actionHref}>
      <Button>{actionLabel}</Button>
    </Link>
  ) : actionLabel ? (
    <Button onClick={onAction}>{actionLabel}</Button>
  ) : null

  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-warm-100 border border-border-warm flex items-center justify-center shadow-subtle mb-1">
        {icon || <UtensilsCrossed className="w-7 h-7 text-primary" />}
      </div>
      <h3 className="font-jakarta text-xl font-bold text-[#171717]">{title}</h3>
      {description && <p className="text-sm text-muted max-w-md leading-relaxed">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}