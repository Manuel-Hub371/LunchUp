import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import RestaurantCard from '@/components/cards/RestaurantCard'
import Storefront from '@/components/restaurants/storefront/Storefront'
import { restaurantService } from '@/lib/services/restaurant.service'
import { foodService } from '@/lib/services/food.service'
import { reviewService } from '@/lib/services/review.service'
import { dealService } from '@/lib/services/deal.service'
import { effectivePrice } from '@/lib/pricing'
import type { Restaurant } from '@/types'

interface StorefrontPageProps {
  params: { id: string }
}

/** Derives a human "GH₵x – GH₵y" range from the vendor's menu prices. */
function computePriceRange(vendorId: string, foods: Awaited<ReturnType<typeof foodService.byVendor>>): string | undefined {
  if (foods.length === 0) return undefined
  const prices = foods.map((food) => effectivePrice(food))
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? `GH₵${min}` : `GH₵${min} – GH₵${max}`
}

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const restaurant = await restaurantService.getById(params.id)
  return {
    title: restaurant ? `${restaurant.name} | LunchUp` : 'Restaurant | LunchUp',
    description: restaurant
      ? `Order from ${restaurant.name} on LunchUp — rated ${restaurant.rating}, deliveries in ${restaurant.deliveryTime}.`
      : 'Browse restaurant menus on LunchUp.',
    alternates: { canonical: `/restaurant/${params.id}` },
  }
}

export default async function RestaurantStorefrontPage({ params }: StorefrontPageProps) {
  const restaurant = await restaurantService.getById(params.id)

  if (!restaurant) {
    notFound()
  }

  const [menuFoods, reviews, similar, allDeals] = await Promise.all([
    foodService.byVendor(restaurant.id),
    reviewService.forVendor(restaurant.id).catch(() => null),
    restaurantService.list({ sort: 'rating', pageSize: 4 }),
    dealService.active().catch(() => []),
  ])

  const deals = allDeals.filter((deal) => deal.food.vendorId === restaurant.id)

  const similarRestaurants = similar.items
    .filter((item: Restaurant) => item.id !== restaurant.id)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      <Storefront
        restaurant={restaurant}
        menuFoods={menuFoods}
        deals={deals}
        reviews={reviews}
        priceRange={computePriceRange(restaurant.id, menuFoods)}
      />

      {similarRestaurants.length > 0 && (
        <section aria-label="More restaurants" className="border-t border-border-warm bg-warm-50">
          <div className="mx-auto w-full max-w-[1200px] px-4 pb-[72px] pt-[42px] sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div>
                <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary">
                  KEEP EXPLORING
                </span>
                <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-charcoal sm:text-[28px]">
                  More restaurants
                </h2>
              </div>
              <Link
                href="/restaurants"
                className="inline-flex shrink-0 items-center gap-2 text-[13px] font-bold text-primary-600 hover:underline"
              >
                View all restaurants
                <span className="text-[18px] leading-none">→</span>
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similarRestaurants.map((item) => (
                <RestaurantCard key={item.id} restaurant={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}