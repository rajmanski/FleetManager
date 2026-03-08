export function normalizeNipDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10)
}

export function formatNipDisplay(digits: string): string {
  const d = normalizeNipDigits(digits)
  const parts: string[] = []
  if (d.length <= 3) {
    parts.push(d)
  } else if (d.length <= 6) {
    parts.push(d.slice(0, 3), d.slice(3))
  } else if (d.length <= 8) {
    parts.push(d.slice(0, 3), d.slice(3, 6), d.slice(6))
  } else {
    parts.push(d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8))
  }
  return parts.join('-')
}
