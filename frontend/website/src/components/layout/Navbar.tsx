'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, ShoppingCart, Menu, X, ChevronDown } from 'lucide-react'
import { useCart } from '@/lib/cart/cart-context'
import { useAuth } from '@/lib/auth/auth-context'
import { initials } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Restaurants', href: '/restaurants', match: (path: string) => path.startsWith('/restaurant') },
  { label: 'Browse Food', href: '/order', match: (path: string) => path === '/order' || path.startsWith('/food') },
  { label: 'Deals', href: '/deals', match: (path: string) => path.startsWith('/deals') },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { count } = useCart()
  const { user, isAuthenticated, hydrated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [accountOpen, setAccountOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    const closeMenu = () => setMobileMenuOpen(false)
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        setSearchOpen(false)
        setAccountOpen(false)
      }
    }
    const closeAccountOnOutsideClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }

    window.addEventListener('resize', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('mousedown', closeAccountOnOutsideClick)
    return () => {
      window.removeEventListener('resize', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('mousedown', closeAccountOnOutsideClick)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/order')
    setSearchOpen(false)
    setMobileMenuOpen(false)
    setSearchQuery('')
  }

  const linkClasses = (href: string, match: (path: string) => boolean) => {
    const active = match(pathname)
    return `rounded-xl px-3.5 py-2 text-[14px] font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
      active
        ? 'bg-warm-100 text-primary font-semibold shadow-xs'
        : 'text-[#404040] hover:text-[#171717] hover:bg-warm-50'
    }`
  }

  const handleLogout = () => {
    logout()
    setAccountOpen(false)
    setMobileMenuOpen(false)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border-warm bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-[72px]">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5" aria-label="LunchUp home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-[16px] font-black text-white shadow-subtle transition-transform duration-200 group-hover:scale-105">
              L
            </span>
            <div className="flex flex-col">
              <span className="font-jakarta text-[21px] font-extrabold tracking-tight text-[#171717]">
                Lunch<span className="text-primary">Up</span>
              </span>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClasses(link.href, link.match)}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2.5 lg:flex">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              aria-expanded={searchOpen}
              className={`rounded-xl p-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                searchOpen ? 'bg-warm-100 text-primary' : 'text-[#525252] hover:bg-warm-50 hover:text-[#171717]'
              }`}
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <Link
              href="/cart"
              aria-label="Cart"
              className={`relative rounded-xl p-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                pathname === '/cart' ? 'bg-warm-100 text-primary' : 'text-[#525252] hover:bg-warm-50 hover:text-[#171717]'
              }`}
            >
              <ShoppingCart className="h-[18px] w-[18px]" />
              {count > 0 && hydrated && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-subtle">
                  {count}
                </span>
              )}
            </Link>

            {hydrated && isAuthenticated && user ? (
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((open) => !open)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-xl p-1.5 pr-2.5 transition-colors hover:bg-warm-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white shadow-subtle">
                    {initials(user.name)}
                  </span>
                  <span className="text-xs font-semibold text-[#171717]">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted" />
                </button>
                {accountOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-border-warm bg-white py-2 shadow-card"
                  >
                    <div className="border-b border-border-warm px-4 py-2.5">
                      <p className="truncate text-sm font-semibold text-[#171717]">{user.name}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                    <Link
                      href="/track"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-2.5 text-sm text-[#404040] transition-colors hover:bg-warm-50 hover:text-[#171717]"
                    >
                      Track an order
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-[14px] font-semibold text-[#404040] transition-colors hover:bg-warm-50 hover:text-[#171717] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-[14px] font-semibold text-white shadow-subtle transition-all hover:bg-primary-600 hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              aria-expanded={searchOpen}
              className={`rounded-xl p-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                searchOpen ? 'bg-warm-100 text-primary' : 'text-[#525252] hover:bg-warm-50'
              }`}
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/cart"
              aria-label="Cart"
              className={`relative rounded-xl p-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                pathname === '/cart' ? 'bg-warm-100 text-primary' : 'text-[#525252] hover:bg-warm-50'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && hydrated && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-subtle">
                  {count}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              className="rounded-xl p-2.5 text-[#525252] hover:bg-warm-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable search */}
      {searchOpen && (
        <div className="border-t border-border-warm bg-white animate-in fade-in duration-150">
          <div className="mx-auto w-full max-w-[1240px] px-4 py-3 sm:px-6 lg:px-8">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for restaurants, local dishes, or deals..."
                aria-label="Search for food or restaurants"
                className="w-full rounded-xl border border-border-warm bg-warm-50/50 py-3 pl-12 pr-28 text-[15px] text-[#171717] transition-all placeholder:text-muted focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-subtle transition-colors hover:bg-primary-600"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="border-t border-border-warm bg-white lg:hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="mx-auto w-full max-w-[1240px] px-4 py-4 sm:px-6">
            <div className="flex flex-col space-y-1">
              {NAV_LINKS.map((link) => {
                const active = link.match(pathname)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex min-h-[44px] items-center rounded-xl px-4 py-3 font-semibold transition-colors ${
                      active
                        ? 'bg-warm-100 text-primary font-bold'
                        : 'text-[#404040] hover:bg-warm-50 hover:text-[#171717]'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}

              {hydrated && isAuthenticated && user ? (
                <div className="mt-2 border-t border-border-warm pt-3">
                  <div className="px-4 py-2">
                    <p className="text-sm font-bold text-[#171717]">{user.name}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                  </div>
                  <Link
                    href="/track"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] items-center rounded-xl px-4 py-3 text-sm font-semibold text-[#404040] transition-colors hover:bg-warm-50 hover:text-[#171717]"
                  >
                    Track an order
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-[44px] w-full items-center rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 pt-3">
                  <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <span className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-border-warm bg-white text-center text-sm font-semibold text-[#404040] transition-colors hover:bg-warm-50 hover:text-[#171717]">
                      Sign In
                    </span>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <span className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-primary text-center text-sm font-semibold text-white shadow-subtle hover:bg-primary-600">
                      Get Started
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
