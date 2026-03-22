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

export function formatDateOnly(value?: string): string {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export type InsuranceExpiryStatus = 'expired' | 'expiring' | 'ok'

export function getInsuranceExpiryStatus(endDateIso: string): InsuranceExpiryStatus {
  const end = new Date(endDateIso)
  if (Number.isNaN(end.getTime())) return 'ok'

  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const today = new Date()
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (endDay < todayDay) return 'expired'

  const limit = new Date(todayDay)
  limit.setDate(limit.getDate() + 30)
  if (endDay <= limit) return 'expiring'

  return 'ok'
}
