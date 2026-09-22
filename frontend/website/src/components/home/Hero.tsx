import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="bg-warm-50/70 border-b border-border-warm/60 py-12 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Content */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-warm-100 border border-border-warm px-3.5 py-1.5 text-xs font-bold text-primary mb-5">
              <span className="h-2 w-2 rounded-full bg-brand-green" />
              <span>Accra&apos;s food marketplace</span>
            </div>

            <h1 className="font-jakarta text-[36px] font-black leading-[1.12] tracking-tight text-[#171717] sm:text-[48px] md:text-[54px] lg:text-[58px]">
              Good food from <br className="hidden sm:inline" />
              <span className="text-primary">restaurants</span> near you.
            </h1>
            
            <p className="mt-5 max-w-[540px] text-[16px] leading-relaxed text-muted md:text-[18px]">
              Discover local favorites and trusted vendors across Ghana. Customize your meal, pay easily with Mobile Money, and get it delivered fresh.
            </p>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/order"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-7 py-3.5 text-[15px] font-bold font-jakarta text-white shadow-subtle transition-all duration-150 hover:bg-primary-600 hover:shadow-card active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-center"
              >
                Browse All Food
              </Link>
              <Link
                href="/restaurants"
                className="inline-flex items-center justify-center rounded-xl border border-border-warm bg-white px-7 py-3.5 text-[15px] font-bold font-jakarta text-[#171717] shadow-subtle transition-all duration-150 hover:border-gray-400 hover:bg-warm-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 text-center"
              >
                View Restaurants
              </Link>
            </div>

            {/* Neighborhood quick pills */}
            <div className="mt-8 pt-6 border-t border-border-warm/70">
              <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5">
                Popular areas in Accra:
              </p>
              <div className="flex flex-wrap gap-2">
                {['East Legon', 'Osu', 'Madina', 'Spintex', 'Airport'].map((area) => (
                  <Link
                    key={area}
                    href={`/restaurants?location=${encodeURIComponent(area)}`}
                    className="inline-flex items-center rounded-lg bg-white border border-border-warm px-3 py-1 text-xs font-semibold text-[#404040] shadow-xs transition-colors hover:border-primary hover:text-primary"
                  >
                    {area}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Image Collage */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/3] lg:aspect-[5/4] overflow-hidden rounded-3xl border border-border-warm bg-white shadow-card">
              <Image
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80"
                alt="Freshly prepared delicious food"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              
              {/* Overlaid stat pill */}
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/95 backdrop-blur-md p-3.5 shadow-card border border-white/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted">Fresh & hot delivery</p>
                  <p className="font-jakarta text-sm font-extrabold text-[#171717]">Average 25–35 mins</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted">Customer rating</p>
                  <p className="font-jakarta text-sm font-extrabold text-[#171717]">4.8 ★★★★★</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
