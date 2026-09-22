/**
 * Cart utilities — pure functions for building and validating cart lines.
 * State is owned by the CartProvider (src/lib/cart/cart-context.tsx).
 */
import type { CartLine, CartSelection, Food } from '@/types'
import { computeUnitPrice } from '@/lib/pricing'
import { configKey } from '@/lib/utils'
import { getFoodById, getRestaurantById } from '@/lib/mock-data'

/** Stable identity for a food configuration (food + selected options). */
export function createCartLineKey(foodId: string, selections: CartSelection[]): string {
  const parts = selections
    .map((selection) => `${selection.groupId}:${[...selection.optionIds].sort().join(',')}`)
    .sort()
  return configKey(`${foodId}|${parts.join('|')}`)
}

export function createCartLine(
  food: Food,
  quantity: number,
  selections: CartSelection[],
  specialInstructions?: string
): CartLine {
  return {
    key: createCartLineKey(food.id, selections),
    food,
    quantity: Math.max(1, quantity),
    selections,
    specialInstructions: specialInstructions?.trim() || undefined,
    unitPrice: computeUnitPrice(food, selections),
  }
}

export interface CartLineIssue {
  key: string
  message: string
  resolved?: boolean
}

export interface CartValidationResult {
  valid: boolean
  lines: CartLine[]
  issues: CartLineIssue[]
}

/**
 * Re-validates cart lines against the current catalog.
 *
 * - Food must still exist
 * - Food must be available
 * - Vendor must be available (not closed / still listing)
 * - Selected options must still exist and be available
 * - Unit price is recomputed from authoritative data
 */
export function validateCartLines(lines: CartLine[]): CartValidationResult {
  const issues: CartLineIssue[] = []
  const output: CartLine[] = []

  for (const line of lines) {
    const food = getFoodById(line.food.id)
    if (!food) {
      issues.push({ key: line.key, message: 'This food is no longer available.' })
      continue
    }
    if (food.available === false) {
      issues.push({ key: line.key, message: `${food.name} is currently unavailable.` })
      continue
    }
    const vendor = getRestaurantById(food.vendorId)
    if (!vendor || vendor.isOpen === false) {
      issues.push({ key: line.key, message: `${food.vendor} is currently unavailable.` })
      continue
    }

    const cleanSelections: CartSelection[] = []
    let validSelections = true
    for (const selection of line.selections) {
      const group = food.customizationGroups?.find((g) => g.id === selection.groupId)
      if (!group) {
        validSelections = false
        break
      }
      const optionIds = selection.optionIds.filter((id) => {
        const option = group.options.find((o) => o.id === id)
        return option && option.available !== false
      })
      if (optionIds.length > 0) {
        cleanSelections.push({ groupId: selection.groupId, optionIds })
      }
    }

    if (!validSelections) {
      issues.push({
        key: line.key,
        message: 'A customization for this food is no longer available.',
        resolved: true,
      })
    }

    const unitPrice = computeUnitPrice(food, cleanSelections)
    output.push({
      ...line,
      food,
      selections: cleanSelections,
      unitPrice,
    })
  }

  return { valid: issues.filter((issue) => !issue.resolved).length === 0, lines: output, issues }
}

/** Sums quantities for badge display. */
export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0)
}

/** Client-side preview subtotal (authoritative total computed at checkout). */
export function previewSubtotal(lines: CartLine[]): number {
  return Math.round(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100) / 100
}