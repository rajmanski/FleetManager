import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from 'lucide-react'

export type OrderStatus =
  | 'New'
  | 'Planned'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'

type OrderStatusBadgeProps = {
  status: OrderStatus | string
  showIcon?: boolean
}

const statusStyles: Record<string, string> = {
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  InProgress: 'bg-blue-100 text-blue-800',
  New: 'bg-gray-100 text-gray-800',
  Planned: 'bg-gray-100 text-gray-800',
}

function StatusIcon({ status }: { status: string }) {
  const s = status as OrderStatus
  switch (s) {
    case 'Completed':
      return <CheckCircle2 className="h-4 w-4" />
    case 'Cancelled':
      return <XCircle className="h-4 w-4" />
    case 'InProgress':
      return <Loader2 className="h-4 w-4 animate-spin" />
    case 'New':
    case 'Planned':
      return <Clock className="h-4 w-4" />
    default:
      return null
  }
}

export function OrderStatusBadge({ status, showIcon = true }: OrderStatusBadgeProps) {
  const style = statusStyles[status] ?? 'bg-gray-100 text-gray-800'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {showIcon && <StatusIcon status={status} />}
      {status}
    </span>
  )
}
