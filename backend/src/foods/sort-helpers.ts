export function getDeliveryMinutes(value: number | string): number {
  if (typeof value === 'number') return value
  const match = /\d+/.exec(value)
  return match ? parseInt(match[0], 10) : 30
}

export function sortByKey<T>(items: T[], key: (item: T) => number, desc = false): T[] {
  return [...items].sort((a, b) => {
    const diff = key(a) - key(b)
    return desc ? -diff : diff
  })
}

export function roundPrice(value: number): number {
  return Math.round(value * 100) / 100
}