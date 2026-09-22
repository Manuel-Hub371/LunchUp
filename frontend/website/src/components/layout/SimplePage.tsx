import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

interface SimplePageProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export default function SimplePage({ title, description, children }: SimplePageProps) {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full container-padding py-12 md:py-16 lg:py-20">
        <div className="mb-8 md:mb-12">
          <h1 className="font-jakarta text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#171717]">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-base sm:text-lg text-muted leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-border-warm p-6 sm:p-8 lg:p-10 shadow-subtle">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}