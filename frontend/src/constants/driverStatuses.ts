export const DRIVER_STATUSES = ['Available', 'OnLeave', 'InRoute'] as const

export const DRIVER_STATUS_OPTIONS = [
  { value: 'Available' as const, label: 'Available' },
  { value: 'OnLeave' as const, label: 'On Leave' },
  { value: 'InRoute' as const, label: 'In Route' },
] as const
