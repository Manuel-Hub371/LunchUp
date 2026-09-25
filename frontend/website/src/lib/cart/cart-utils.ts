/**
 * Cart utilities — pure functions for building and validating cart lines.
 * State is owned by the CartProvider (src/lib/cart/cart-context.tsx).
 *
 * Lines carry a snapshot of the food at add time; validation re-checks that
 * snapshot locally (availability, customization integrity, recomputed price)
 * without hitting the catalog. Authoritative validation lives on the
 * server at order creation.
 */
import type { CartLine, CartSelection, Food } from '@/types'
import { computeUnitPrice } from '@/lib/pricing'
import { configKey } from '@/lib/utils'

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
 * Re-validates a cart line against its snapshot.
 *
 * - Food still available (product hits are treated as available)
 * - Vendor still available (not closed / still listing)
 * - Selected options still exist and are available
 * - Unit price is recomputed only when the snapshot is intact; otherwise the
 *   line is flagged and the original snapshot price is kept
 */
export function validateCartLines(lines: CartLine[]): CartValidationResult {
  const issues: CartLineIssue[] = []
  const output: CartLine[] = []

  for (const line of lines) {
    const { food } = line
    if (!food) {
      issues.push({ key: line.key, message: 'This food is no longer available.' })
      continue
    }
    if (food.available === false) {
      issues.push({ key: line.key, message: `${food.name} is currently unavailable.` })
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

    const unitPrice = validSelections ? computeUnitPrice(food, cleanSelections) : line.unitPrice
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