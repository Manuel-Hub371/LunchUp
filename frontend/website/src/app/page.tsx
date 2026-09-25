import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import FeaturedRestaurants from '@/components/home/FeaturedRestaurants'
import PopularFood from '@/components/home/PopularFood'
import CategoriesSection from '@/components/home/CategoriesSection'
import TodayDeals from '@/components/home/TodayDeals'
import VendorCTA from '@/components/home/VendorCTA'
import DownloadAppCTA from '@/components/home/DownloadAppCTA'
import NewsletterCTA from '@/components/home/NewsletterCTA'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'LunchUp - Order Food from Restaurants Near You',
  description:
    'Discover and order from restaurants and food vendors across Ghana. Browse menus, find deals, and get fresh meals delivered.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'LunchUp - Order Food from Restaurants Near You',
    description:
      'Discover and order from restaurants and food vendors across Ghana. Browse menus, find deals, and get fresh meals delivered.',
    type: 'website',
    locale: 'en_GH',
    url: '/',
    siteName: 'LunchUp',
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <CategoriesSection />
        <FeaturedRestaurants />
        <PopularFood />
        <TodayDeals />
        <VendorCTA />
        <DownloadAppCTA />
        <NewsletterCTA />
      </main>
      <Footer />
    </div>
  )
}
