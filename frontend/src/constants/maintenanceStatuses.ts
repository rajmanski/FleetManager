import { Clock, Loader2, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const MAINTENANCE_STATUSES = ['Scheduled', 'InProgress', 'Completed'] as const

export type MaintenanceStatusMeta = {
  label: string
  Icon: LucideIcon
  bgClass: string
}

export const MAINTENANCE_STATUS_CONFIG: Record<string, MaintenanceStatusMeta> = {
  Scheduled: {
    label: 'Scheduled',
    Icon: Clock,
    bgClass: 'bg-blue-100 text-blue-800',
  },
  InProgress: {
    label: 'In Progress',
    Icon: Loader2,
    bgClass: 'bg-sky-100 text-sky-800',
  },
  Completed: {
    label: 'Completed',
    Icon: CheckCircle2,
    bgClass: 'bg-emerald-100 text-emerald-800',
  },
}
