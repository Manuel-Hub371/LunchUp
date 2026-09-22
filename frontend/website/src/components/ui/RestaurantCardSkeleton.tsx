import React from 'react'

export default function RestaurantCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border-warm bg-white shadow-subtle animate-pulse">
      {/* Banner image skeleton */}
      <div className="relative h-44 w-full bg-gray-200">
        <div className="absolute left-3 top-3 h-6 w-20 rounded-lg bg-gray-300/80" />
        <div className="absolute right-3 top-3 h-8 w-8 rounded-full bg-gray-300/80" />
      </div>

      {/* Body */}
      <div className="relative flex flex-1 flex-col px-4 pb-4 pt-10">
        {/* Overlapping logo skeleton */}
        <div className="absolute -top-7 left-4 h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-white shadow-card">
          <div className="h-full w-full bg-gray-300" />
        </div>

        <div className="h-4 w-2/3 rounded-lg bg-gray-200" />
        <div className="mt-2 h-3 w-28 rounded-md bg-gray-200" />
        <div className="mt-3 h-3 w-1/2 rounded-md bg-gray-200" />

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-warm pt-3.5">
          <div className="h-3 w-24 rounded-md bg-gray-200" />
          <div className="h-3 w-20 rounded-md bg-gray-200" />
        </div>
      </div>
    </div>
  )
}