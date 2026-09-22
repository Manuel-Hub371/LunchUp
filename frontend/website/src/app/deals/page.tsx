'use client'

import React, { useEffect, useState } from 'react'
import { Tag, Percent } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FoodCard from '@/components/cards/FoodCard'
import LoadingState from '@/components/ui/LoadingState'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { dealService, type DealWithFood } from '@/lib/services/deal.service'

export default function DealsPage() {
  const [deals, setDeals] = useState<DealWithFood[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setDeals(await dealService.active())
    } catch {
      setError('Could not load deals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 to-white border-b border-border-warm/50 py-12 md:py-16">
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-semibold text-primary-700 mb-4">
            <Tag className="h-4 w-4" />
            Limited Time
          </div>
          <h1 className="font-jakarta mb-3 text-[36px] font-bold tracking-tight text-[#171717] md:text-[44px]">
            Today&apos;s Deals
          </h1>
          <p className="text-[16px] text-[#525252] md:text-[17px] max-w-2xl">
            Save on your favorite meals. Fresh deals from restaurants and vendors across Ghana.
          </p>
        </div>
      </section>

      <main className="flex-1 py-10 md:py-14">
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6 lg:px-8">
          {loading ? (
            <LoadingState label="Finding today's deals..." />
          ) : error ? (
            <ErrorState title="Could not load deals" description={error} onRetry={load} />
          ) : deals && deals.length === 0 ? (
            <EmptyState
              title="No deals right now"
              description="Check back later — new deals drop regularly."
              actionLabel="Browse food"
              actionHref="/order"
            />
          ) : (
            <>
              {/* Stats */}
              <div className="mb-8 flex items-center gap-6 rounded-xl bg-white border border-border-warm p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
                    <Percent className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#171717]">{deals?.length}</div>
                    <div className="text-sm text-[#737373]">Active deals</div>
                  </div>
                </div>
                <div className="h-10 w-px bg-border-warm" />
                <p className="text-sm text-[#525252]">
                  Discounts already applied — no promo code needed
                </p>
              </div>

              {/* Deals Grid */}
              <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
                {deals?.map((deal) => (
                  <FoodCard key={deal.id} food={deal.food} />
                ))}
              </div>

              {/* Info */}
              <div className="mt-10 rounded-xl bg-gradient-to-br from-warm-50 to-white border border-border-warm p-6 text-center">
                <h2 className="font-semibold text-[#171717] mb-2">
                  Want to save even more?
                </h2>
                <p className="text-sm text-[#737373]">
                  Apply promo codes at checkout for additional discounts. Try{' '}
                  <span className="font-semibold text-[#171717]">LUNCH10</span>,{' '}
                  <span className="font-semibold text-[#171717]">FIRST20</span>, or{' '}
                  <span className="font-semibold text-[#171717]">FREEDEL</span>
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
