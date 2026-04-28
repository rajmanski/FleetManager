import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const TRIP_STATUSES = ['Scheduled', 'Active', 'Finished', 'Aborted'] as const

export type TripStatusMeta = {
  label: string
  Icon: LucideIcon
  bgClass: string
}

export const TRIP_STATUS_CONFIG: Record<string, TripStatusMeta> = {
  Scheduled: {
    label: 'Scheduled',
    Icon: Clock,
    bgClass: 'bg-blue-100 text-blue-800',
  },
  Active: {
    label: 'Active',
    Icon: Loader2,
    bgClass: 'bg-sky-100 text-sky-800',
  },
  Finished: {
    label: 'Finished',
    Icon: CheckCircle2,
    bgClass: 'bg-emerald-100 text-emerald-800',
  },
  Aborted: {
    label: 'Aborted',
    Icon: XCircle,
    bgClass: 'bg-red-100 text-red-800',
  },
}
