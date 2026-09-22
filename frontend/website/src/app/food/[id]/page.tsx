import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FoodCard from '@/components/cards/FoodCard'
import FoodDetails from '@/components/food/details/FoodDetails'
import UnavailableState from '@/components/ui/UnavailableState'
import { foodService } from '@/lib/services/food.service'
import { restaurantService } from '@/lib/services/restaurant.service'

interface FoodDetailPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: FoodDetailPageProps): Promise<Metadata> {
  const food = await foodService.getById(params.id).catch(() => null)
  return {
    title: food ? `${food.name} | LunchUp` : 'Food not found | LunchUp',
    description: food?.description ?? 'Browse food on LunchUp.',
    alternates: { canonical: `/food/${params.id}` },
  }
}

export default async function FoodDetailPage({ params }: FoodDetailPageProps) {
  const food = await foodService.getById(params.id).catch(() => null)
  if (!food) {
    notFound()
  }

  const [restaurant, related] = await Promise.all([
    restaurantService.getById(food.vendorId).catch(() => null),
    foodService.similar(food.id, 4).catch(() => []),
  ])

  const restaurantMissing = !restaurant

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      <main className="mx-auto w-full max-w-[1240px] px-4 pb-[80px] pt-8 md:px-6 md:pt-10 lg:px-8 lg:pt-[42px]">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-[13px] text-muted">
          <Link href="/" className="transition-colors hover:text-primary-600">
            Home
          </Link>
          <span aria-hidden className="text-muted/60">/</span>
          <Link href="/order" className="transition-colors hover:text-primary-600">
            Explore Food
          </Link>
          <span aria-hidden className="text-muted/60">/</span>
          <span className="font-bold text-charcoal">Food Details</span>
        </nav>

        {restaurantMissing && (
          <div className="mb-8">
            <UnavailableState
              title="This restaurant is no longer available"
              description={`We could not load details for ${food.vendor}. This meal may still be shown for reference.`}
              actionLabel="Browse more food"
              actionHref="/order"
            />
          </div>
        )}

        <FoodDetails food={food} restaurant={restaurant} />
      </main>

      {related.length > 0 && (
        <section aria-label={`More from ${food.vendor}`} className="border-t border-border-warm">
          <div className="mx-auto w-full max-w-[1240px] px-4 pb-[80px] pt-[42px] md:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div>
                <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary">
                  MORE FROM {food.vendor.toUpperCase()}
                </span>
                <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-charcoal sm:text-[28px]">
                  You may also like
                </h2>
                <p className="mt-1.5 text-[13px] text-muted">
                  More delicious meals from {food.vendor}
                </p>
              </div>
              <Link
                href={`/restaurant/${food.vendorId}`}
                className="inline-flex shrink-0 items-center gap-2 text-[13px] font-bold text-primary-600 hover:underline"
              >
                View store
                <span className="text-[18px] leading-none">→</span>
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <FoodCard key={item.id} food={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}