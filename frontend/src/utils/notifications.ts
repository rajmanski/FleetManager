import type { Notification } from '@/types/notifications'

export function isNotificationUnread(n: Notification): boolean {
  return n.is_read !== true
}

export function formatNotificationTypeLabel(type: string): string {
  switch (type) {
    case 'Insurance_Expiry':
      return 'Insurance expiry'
    case 'Inspection_Due':
      return 'Inspection due'
    case 'Certificate_Expiry':
      return 'Certificate expiry'
    case 'Fuel_Anomaly':
      return 'Fuel anomaly'
    case 'Maintenance_Due':
      return 'Maintenance due'
    default:
      return type.replaceAll('_', ' ')
  }
}
