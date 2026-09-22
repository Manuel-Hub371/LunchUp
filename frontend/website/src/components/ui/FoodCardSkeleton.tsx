import React from 'react'

interface FoodCardSkeletonProps {
  compact?: boolean
}

export default function FoodCardSkeleton({ compact = false }: FoodCardSkeletonProps) {
  if (compact) {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-[#ececec] bg-white shadow-sm animate-pulse">
        <div className="aspect-square w-full bg-gray-200" />

        <div className="flex flex-1 flex-col p-2">
          <div className="h-2.5 w-3/4 rounded bg-gray-200" />
          <div className="mt-1 h-2 w-1/2 rounded bg-gray-200" />
          <div className="mt-1 h-2 w-1/3 rounded bg-gray-200" />

          <div className="mt-auto flex items-center justify-between gap-1 pt-1.5">
            <div className="h-3.5 w-10 rounded bg-gray-200" />
            <div className="h-6 w-6 rounded-md bg-gray-200" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border-warm bg-white shadow-subtle animate-pulse">
      <div className="relative aspect-[4/3] w-full bg-gray-200">
        <div className="absolute left-3 top-3 h-5 w-16 rounded-lg bg-gray-300" />
        <div className="absolute right-3 top-3 h-8 w-8 rounded-full bg-gray-300" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="h-4 w-3/4 rounded-lg bg-gray-200" />
        <div className="mt-2 h-3 w-1/3 rounded-md bg-gray-200" />
        <div className="mt-4 flex items-center justify-between border-t border-border-warm pt-3">
          <div className="h-4 w-16 rounded-md bg-gray-200" />
          <div className="h-3 w-12 rounded-md bg-gray-200" />
        </div>

        <div className="mt-3.5 pt-1">
          <div className="h-9 w-full rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  )
}