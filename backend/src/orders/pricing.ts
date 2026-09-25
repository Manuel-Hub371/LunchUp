import { Food } from '@prisma/client'
import { ApiException } from '../common/api-exception'

export interface SelectionInput {
  groupId: string
  optionIds: string[]
}

export interface GroupWithOptions extends Food {
  customizationGroups?: {
    id: string
    name: string
    required: boolean
    minSelections: number
    maxSelections: number
    options: {
      id: string
      name: string
      priceModifier: number
      available: boolean
    }[]
  }[]
}

export interface SelectionSummary {
  groupName: string
  optionNames: string[]
  priceModifier: number
}

function discounted(base: number, discount: number): number {
  return discount > 0 ? Math.round(base * (1 - discount / 100) * 100) / 100 : base
}

/**
 * Validates every selection against the live food catalog and returns the
 * server-authoritative unit price contribution and a human-readable summary.
 * Browser-provided prices/modifiers are never trusted here.
 */
export function computeSelection(food: GroupWithOptions, selections: SelectionInput[]): {
  unitPrice: number
  summaries: SelectionSummary[]
} {
  let unitPrice = discounted(food.price, food.discount)
  const groups = food.customizationGroups || []
  const summaries: SelectionSummary[] = []

  for (const group of groups) {
    const picked = selections.find((s) => s.groupId === group.id)
    const optionIds = (picked?.optionIds || []).filter((id) =>
      group.options.some((o) => o.id === id)
    )

    if (group.required && optionIds.length < group.minSelections) {
      throw ApiException.validation(`${food.name}: ${group.name} requires at least ${group.minSelections} selection${group.minSelections > 1 ? 's' : ''}.`)
    }
    if (optionIds.length > group.maxSelections) {
      throw ApiException.validation(`${food.name}: ${group.name} allows at most ${group.maxSelections} selection${group.maxSelections > 1 ? 's' : ''}.`)
    }

    for (const optionId of optionIds) {
      const option = group.options.find((o) => o.id === optionId)
      if (!option) {
        throw ApiException.validation(`${food.name}: a selected option is no longer offered.`)
      }
      if (option.available === false) {
        throw ApiException.validation(`${food.name}: a selected option is no longer available.`)
      }
    }

    if (optionIds.length > 0) {
      const selectedOptions = group.options.filter((o) => optionIds.includes(o.id))
      const modifier = selectedOptions.reduce((sum, o) => sum + o.priceModifier, 0)
      unitPrice += modifier
      summaries.push({
        groupName: group.name,
        optionNames: selectedOptions.map((o) => o.name),
        priceModifier: Math.round(modifier * 100) / 100,
      })
    }
  }

  return { unitPrice: Math.round(unitPrice * 100) / 100, summaries }
}

export function roundPrice(value: number): number {
  return Math.round(value * 100) / 100
}