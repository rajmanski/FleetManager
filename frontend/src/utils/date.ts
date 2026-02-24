export function isDateExpired(dateStr?: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return !Number.isNaN(d.getTime()) && d < new Date()
}

export function formatDateTime(value?: string): string {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
