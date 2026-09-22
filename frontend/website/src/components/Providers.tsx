'use client'

import React from 'react'
import { CartProvider } from '@/lib/cart/cart-context'
import { AuthProvider } from '@/lib/auth/auth-context'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  )
}