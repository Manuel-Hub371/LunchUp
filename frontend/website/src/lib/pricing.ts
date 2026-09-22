/**
 * Pricing helpers.
 *
 * IMPORTANT: These compute CLIENT-SIDE PREVIEWS only. The authoritative
 * price for an order is always recomputed by the order service at
 * checkout. Never trust a browser-supplied total.
 */
import type { CartSelection, Food } from '@/types'

export function effectivePrice(food: Food): number {
  return food.discount && food.discount > 0
    ? Math.round(food.price * (1 - food.discount / 100))
    : food.price
}

export interface PriceBreakdown {
  base: number
  modifiers: number
  unitPrice: number
  lineTotal: number
  quantity: number
}

/** Recomputes the unit price for a food given selected customization options. */
export function computeUnitPrice(food: Food, selections: CartSelection[]): number {
  let price = effectivePrice(food)

  for (const selection of selections) {
    const group = food.customizationGroups?.find((g) => g.id === selection.groupId)
    if (!group) continue
    for (const optionId of selection.optionIds) {
      const option = group.options.find((o) => o.id === optionId)
      if (option) {
        price += option.priceModifier
      }
    }
  }

  return Math.round(price * 100) / 100
}

/** Full preview breakdown for display in customizer / cart. */
export function computeLineBreakdown(
  food: Food,
  selections: CartSelection[],
  quantity: number
): PriceBreakdown {
  const base = effectivePrice(food)
  const modifiers = computeUnitPrice(food, selections) - base
  const unitPrice = base + modifiers
  return {
    base,
    modifiers,
    unitPrice,
    lineTotal: unitPrice * quantity,
    quantity,
  }
}