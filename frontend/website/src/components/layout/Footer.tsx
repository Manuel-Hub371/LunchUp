import React from 'react'
import Link from 'next/link'

const exploreLinks = [
  { label: 'Restaurants', href: '/restaurants' },
  { label: 'Browse Food', href: '/order' },
  { label: 'Deals', href: '/deals' },
]

const lunchUpLinks = [
  { label: 'About', href: '/about' },
  { label: 'Become a Vendor', href: '/vendor/info' },
  { label: 'Download App', href: '/download' },
  { label: 'Contact', href: '/contact' },
]

const supportLinks = [
  { label: 'Help Center', href: '/help' },
  { label: 'FAQs', href: '/faq' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]

const columns = [
  { title: 'Explore', links: exploreLinks },
  { title: 'Company', links: lunchUpLinks },
  { title: 'Support', links: supportLinks },
]

export default function Footer() {
  return (
    <footer className="border-t border-[#262626] bg-[#121212] text-white">
      <div className="mx-auto w-full max-w-[1240px] px-4 pb-8 pt-14 sm:px-6 md:pt-16 lg:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 pb-12 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="LunchUp home">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-[16px] font-black text-white shadow-subtle">
                L
              </span>
              <span className="font-jakarta text-[21px] font-extrabold tracking-tight text-white">
                Lunch<span className="text-primary">Up</span>
              </span>
            </Link>
            <p className="mt-4 max-w-[280px] text-[13px] leading-relaxed text-neutral-400">
              Discover and order freshly prepared meals from trusted restaurants and food vendors across Ghana.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-neutral-400">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-green" />
              <span>Payments secured by Mobile Money & Card</span>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h4 className="font-jakarta mb-4 text-[13px] font-bold uppercase tracking-wider text-neutral-200">
                {column.title}
              </h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-neutral-400 transition-colors duration-150 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-3 border-t border-[#262626] pt-8 text-[12px] text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} LunchUp Technologies Ltd. All rights reserved.</span>
          <span className="font-medium text-neutral-300">Made with care for Ghana 🇬🇭</span>
        </div>
      </div>
    </footer>
  )
}
