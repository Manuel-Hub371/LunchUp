'use client'

import React, { useCallback, useState } from 'react'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import LoadingState from '@/components/ui/LoadingState'
import Rating from '@/components/ui/Rating'
import { MessageSquare } from 'lucide-react'
import SectionHeading from '../SectionHeading'
import { reviewService } from '@/lib/services/review.service'
import type { Restaurant, Review } from '@/types'

interface StorefrontReviewsProps {
  restaurant: Restaurant
  reviews: Review[] | null
}

interface ReviewCardProps {
  review: Review
}

function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="flex flex-col gap-3.5 rounded-2xl border border-[#ece7e1] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-50 text-primary">
            <span className="text-[14px] font-extrabold">
              {(review.customerName || 'C').charAt(0).toUpperCase()}
            </span>
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-[13px] font-bold text-[#262626]">
              {review.customerName || 'LunchUp Customer'}
            </strong>
            <span className="mt-0.5 flex items-center gap-2 text-[11px] text-[#a3a3a3]">
              {review.createdAt
                ? new Date(review.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : null}
            </span>
          </div>
        </div>
        <Rating value={review.rating} showValue={false} />
      </div>
      {review.comment && (
        <p className="text-[13px] leading-[1.65] text-[#666666]">&ldquo;{review.comment}&rdquo;</p>
      )}
    </article>
  )
}

export default function StorefrontReviews({ restaurant, reviews }: StorefrontReviewsProps) {
  const [list, setList] = useState<Review[] | null>(reviews)
  const [loading, setLoading] = useState(false)

  const loadReviews = useCallback(() => {
    setLoading(true)
    reviewService
      .forVendor(restaurant.id)
      .then((result) => setList(result))
      .catch(() => setList(null))
      .finally(() => setLoading(false))
  }, [restaurant.id])

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="CUSTOMER REVIEWS"
        title="What customers say"
        subtitle={`Real feedback from people who ordered from ${restaurant.name}.`}
      />

      <div className="flex items-center gap-5 rounded-2xl border border-[#ece7e1] bg-white px-5 py-[22px]">
        <Rating value={restaurant.rating} size="lg" showValue={false} />
        <div className="flex flex-col gap-1">
          <strong className="text-[22px] leading-none text-[#171717]">
            {restaurant.rating.toFixed(1)}
          </strong>
          <span className="text-[12px] text-[#858585]">
            Based on {restaurant.reviewCount} reviews
          </span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#ece7e1] bg-white">
          <LoadingState label="Loading reviews..." />
        </div>
      ) : list === null ? (
        <div className="rounded-2xl border border-[#ece7e1] bg-white">
          <ErrorState
            title="Couldn't load reviews"
            description="There was a problem fetching this restaurant's reviews."
            onRetry={loadReviews}
          />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-[#ece7e1] bg-white">
          <EmptyState
            icon={<MessageSquare className="h-8 w-8 text-primary" />}
            title="No reviews yet"
            description="Be the first to share your experience at this restaurant."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}