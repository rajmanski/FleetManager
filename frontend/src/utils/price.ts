export function formatPrice(pln?: number): string {
  if (pln == null) return '-'
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
  }).format(pln)
}
