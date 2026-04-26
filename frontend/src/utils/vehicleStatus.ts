import { Ban, Route, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type VehicleStatusMeta = {
  label: string
  description: string
  Icon: LucideIcon
  colorClass: string
}

const DEFAULT_VEHICLE_STATUS_META: VehicleStatusMeta = {
  label: 'Unknown',
  description: 'Vehicle status.',
  Icon: Route,
  colorClass: 'text-gray-600',
}

export function getVehicleStatusMeta(status: string): VehicleStatusMeta {
  switch (status) {
    case 'Available':
      return {
        label: 'Available',
        description: 'Vehicle can be assigned to new trips.',
        Icon: Route,
        colorClass: 'text-emerald-600',
      }
    case 'InRoute':
      return {
        label: 'In route',
        description: 'Vehicle is currently assigned and active in transport.',
        Icon: Route,
        colorClass: 'text-blue-600',
      }
    case 'Service':
      return {
        label: 'Service',
        description: 'Vehicle is in maintenance and unavailable for assignments.',
        Icon: Wrench,
        colorClass: 'text-amber-600',
      }
    case 'Inactive':
      return {
        label: 'Inactive',
        description: 'Vehicle is temporarily disabled from operational use.',
        Icon: Ban,
        colorClass: 'text-gray-600',
      }
    default:
      return {
        ...DEFAULT_VEHICLE_STATUS_META,
        label: status,
      }
  }
}

export function formatVehicleStatusLabel(status: string): string {
  return getVehicleStatusMeta(status).label
}
