import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Store, TrendingUp, Users } from 'lucide-react'

const stats = [
  { icon: Store, label: 'Active vendors', value: '200+' },
  { icon: Users, label: 'Monthly customers', value: '50K+' },
  { icon: TrendingUp, label: 'Avg. revenue growth', value: '3×' },
]

export default function VendorCTA() {
  return (
    <section className="bg-white py-14 md:py-20 border-b border-border-warm/50">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-0 overflow-hidden rounded-2xl border border-border-warm shadow-card lg:grid-cols-2">
          {/* Left — content */}
          <div className="flex flex-col justify-center bg-warm-50 px-8 py-12 md:px-12 md:py-16">
            <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold tracking-wide text-primary uppercase">
              For Vendors
            </div>
            <h2 className="font-jakarta mb-4 text-[26px] font-extrabold leading-tight tracking-tight text-[#171717] sm:text-[32px]">
              Sell your food on LunchUp
            </h2>
            <p className="mb-6 max-w-[480px] text-[15px] leading-relaxed text-muted">
              Reach thousands of hungry customers across Accra. Join the restaurants and home cooks already growing with LunchUp.
            </p>

            {/* Stats row */}
            <div className="mb-8 grid grid-cols-3 gap-4 border-y border-border-warm py-6">
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center">
                  <div className="font-jakarta text-[22px] font-extrabold text-[#171717]">{value}</div>
                  <div className="mt-0.5 text-[11px] text-muted leading-tight">{label}</div>
                </div>
              ))}
            </div>

            <Link
              href="/vendor/register"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-6 py-3 text-[14px] font-bold text-white shadow-subtle transition-all hover:bg-primary-600 hover:shadow-card active:scale-95"
            >
              Become a vendor
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/vendor/info"
              className="mt-4 inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-muted hover:text-[#171717] transition-colors"
            >
              Learn more about selling on LunchUp →
            </Link>
          </div>

          {/* Right — image */}
          <div className="relative min-h-[280px] lg:min-h-0">
            <Image
              src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80"
              alt="Restaurant kitchen"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
