import Image from 'next/image'
import { Smartphone } from 'lucide-react'
import { appStoreLinks } from '@/lib/mock-data'

export default function DownloadAppCTA() {
  return (
    <section className="bg-warm-50 py-14 md:py-20">
      <div className="mx-auto w-full max-w-[1240px] px-4 md:px-6 lg:px-8">
        <div className="grid items-center gap-10 overflow-hidden rounded-2xl bg-charcoal text-white lg:grid-cols-2 lg:gap-0">
          <div className="px-6 py-10 md:px-12 md:py-14">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold">
              <Smartphone className="h-3.5 w-3.5" />
              Mobile App
            </div>
            <h2 className="font-jakarta mb-4 text-[28px] font-bold leading-tight tracking-tight md:text-[32px]">
              Order on the go
            </h2>
            <p className="mb-6 max-w-[480px] text-[15px] leading-relaxed text-gray-300">
              Download the LunchUp app to order faster, track deliveries, and discover food near you.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={appStoreLinks.ios}
                className="inline-flex items-center gap-3 rounded-lg bg-white px-4 py-2.5 text-charcoal transition-colors hover:bg-warm-100"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] text-muted">Download on the</div>
                  <div className="text-[13px] font-semibold">App Store</div>
                </div>
              </a>
              <a
                href={appStoreLinks.googlePlay}
                className="inline-flex items-center gap-3 rounded-lg bg-white px-4 py-2.5 text-charcoal transition-colors hover:bg-warm-100"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] text-muted">Get it on</div>
                  <div className="text-[13px] font-semibold">Google Play</div>
                </div>
              </a>
            </div>
          </div>

          <div className="relative flex justify-center px-6 py-10 lg:justify-end lg:px-12 lg:py-14">
            <div className="relative h-[340px] w-[190px] overflow-hidden rounded-[28px] border-4 border-white/20 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80"
                alt="LunchUp mobile app"
                fill
                sizes="190px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
