import React, { useEffect } from 'react'
import { X, SlidersHorizontal } from 'lucide-react'

interface FilterSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function FilterSheet({
  open,
  onClose,
  title = 'Filters',
  children,
  footer,
}: FilterSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-warm">
          <span className="flex items-center gap-2 font-semibold text-charcoal">
            <SlidersHorizontal className="w-4 h-4" />
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="p-2 rounded-lg text-charcoal hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">{children}</div>
        {footer && <div className="border-t border-border-warm px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}