import { TRIP_STATUS_CONFIG } from '@/constants/tripStatuses'

type TripStatusBadgeProps = {
  status: string
  showIcon?: boolean
}

export function TripStatusBadge({ status, showIcon = true }: TripStatusBadgeProps) {
  const config = TRIP_STATUS_CONFIG[status]
  if (!config) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800">
        {status}
      </span>
    )
  }

  const Icon = config.Icon
  const isAnimating = status === 'Active'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.bgClass}`}>
      {showIcon && (
        <Icon className={`h-4 w-4 ${isAnimating ? 'animate-spin' : ''}`} aria-hidden="true" />
      )}
      {config.label}
    </span>
  )
}
