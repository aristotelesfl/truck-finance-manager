export function numberToCents(value: number): number {
  return Math.round(value * 100)
}

export function centsToNumber(cents: number): number {
  return cents / 100
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCents(cents: number): string {
  return currencyFormatter.format(centsToNumber(cents))
}
