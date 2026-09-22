/**
 * Shared food category display labels.
 * Mirrors the numeric `food.category` terms used across the catalog.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  local: 'Local',
  fastfood: 'Fast Food',
  continental: 'Continental',
  snacks: 'Snacks',
  drinks: 'Drinks',
  desserts: 'Desserts',
}

export function categoryLabel(category?: string): string | null {
  if (!category) return null
  return CATEGORY_LABELS[category] ?? `${category[0].toUpperCase()}${category.slice(1)}`
}