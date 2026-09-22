import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LunchUp - Delicious Meals, Delivered to You',
  description: 'Your favorite meals from trusted vendors, freshly prepared and delivered with care.',
  openGraph: {
    title: 'LunchUp - Delicious Meals, Delivered to You',
    description: 'Your favorite meals from trusted vendors, freshly prepared and delivered with care.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${dmSans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
