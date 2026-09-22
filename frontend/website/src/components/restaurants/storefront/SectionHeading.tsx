import React from 'react'
import Link from 'next/link'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  subtitle?: string
  actionLabel?: string
  actionHref?: string
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionHref,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
      <div>
        <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#f97316]">
          {eyebrow}
        </span>
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#171717] sm:text-[28px]">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-[13px] leading-[1.5] text-[#858585] sm:text-[14px]">{subtitle}</p>}
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex shrink-0 items-center gap-2 text-[13px] font-bold text-[#ea580c] hover:underline"
        >
          {actionLabel}
          <span className="text-[18px] leading-none">→</span>
        </Link>
      )}
    </div>
  )
}