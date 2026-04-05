import { formatNotificationTypeLabel } from '@/utils/notifications'

export const NOTIFICATION_TYPE_VALUES = [
  'Insurance_Expiry',
  'Inspection_Due',
  'Certificate_Expiry',
  'Fuel_Anomaly',
] as const

export const NOTIFICATION_TYPE_FILTER_OPTIONS = NOTIFICATION_TYPE_VALUES.map((value) => ({
  value,
  label: formatNotificationTypeLabel(value),
}))
