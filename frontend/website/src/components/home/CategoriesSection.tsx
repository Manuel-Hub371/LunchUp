import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { categoryService } from '@/lib/services/category.service'

export default async function CategoriesSection() {
  const categories = await categoryService.list().catch(() => [])
  if (categories.length === 0) return null

  return (
    <section className="bg-white py-14 md:py-20 border-b border-border-warm/50">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-jakarta text-[26px] font-extrabold tracking-tight text-[#171717] sm:text-[32px]">
              Explore by category
            </h2>
            <p className="mt-1.5 text-[15px] text-muted">
              What are you in the mood for?
            </p>
          </div>
          <Link
            href="/order"
            className="hidden sm:inline-flex text-sm font-bold text-primary hover:text-primary-600 transition-colors"
          >
            All categories &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-6 md:gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/order?category=${category.slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border-warm bg-warm-50/40 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-white hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary text-center"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-border-warm bg-white shadow-subtle transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <span className="font-jakarta text-[14px] font-bold text-[#171717] transition-colors group-hover:text-primary">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
