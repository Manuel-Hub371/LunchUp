'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CartLine, CartSelection, Food } from '@/types'
import {
  cartCount,
  createCartLine,
  previewSubtotal,
} from './cart-utils'

interface AddLineOptions {
  quantity?: number
  selections?: CartSelection[]
  specialInstructions?: string
}

interface CartContextValue {
  lines: CartLine[]
  count: number
  subtotal: number
  hydrated: boolean
  addLine: (food: Food, options?: AddLineOptions) => void
  updateQuantity: (key: string, delta: number) => void
  removeLine: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'lunchup.cart.v1'
const MAX_QUANTITY = 50

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartLine[]) : []
  } catch {
    return []
  }
}

function persist(lines: CartLine[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  } catch {
    /* storage unavailable */
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setLines(readStored())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) persist(lines)
  }, [lines, hydrated])

  const value = useMemo<CartContextValue>(() => {
    const addLine: CartContextValue['addLine'] = (food, options = {}) => {
      const quantity = Math.min(MAX_QUANTITY, Math.max(1, options.quantity || 1))
      const line = createCartLine(
        food,
        quantity,
        options.selections || [],
        options.specialInstructions
      )
      setLines((prev) => {
        const existing = prev.find((item) => item.key === line.key)
        if (existing) {
          return prev.map((item) =>
            item.key === line.key
              ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + line.quantity) }
              : item
          )
        }
        return [...prev, line]
      })
    }

    const updateQuantity: CartContextValue['updateQuantity'] = (key, delta) => {
      setLines((prev) =>
        prev.map((item) =>
          item.key === key
            ? { ...item, quantity: Math.min(MAX_QUANTITY, Math.max(1, item.quantity + delta)) }
            : item
        )
      )
    }

    const removeLine: CartContextValue['removeLine'] = (key) => {
      setLines((prev) => prev.filter((item) => item.key !== key))
    }

    return {
      lines,
      count: cartCount(lines),
      subtotal: previewSubtotal(lines),
      hydrated,
      addLine,
      updateQuantity,
      removeLine,
      clear: () => setLines([]),
    }
  }, [lines, hydrated])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}