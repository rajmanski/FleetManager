import type { ReactNode } from 'react'
import { AlertTriangle, Fuel, IdCard, ShieldAlert, Wrench } from 'lucide-react'

export function notificationDetailsPath(type: string): string {
  switch (type) {
    case 'Insurance_Expiry':
      return '/insurance'
    case 'Inspection_Due':
    case 'Maintenance_Due':
      return '/maintenance'
    case 'Certificate_Expiry':
      return '/drivers'
    case 'Fuel_Anomaly':
      return '/fuel'
    default:
      return '/notifications'
  }
}

export function extractVehicleVin(message: string | null): string | null {
  if (!message) {
    return null
  }

  const match = message.match(/\b[A-HJ-NPR-Z0-9]{17}\b/)
  return match ? match[0] : null
}

export function notificationTypeIcon(type: string): ReactNode {
  switch (type) {
    case 'Insurance_Expiry':
      return <ShieldAlert className="size-4 text-amber-600" aria-hidden="true" />
    case 'Inspection_Due':
    case 'Maintenance_Due':
      return <Wrench className="size-4 text-amber-600" aria-hidden="true" />
    case 'Certificate_Expiry':
      return <IdCard className="size-4 text-amber-600" aria-hidden="true" />
    case 'Fuel_Anomaly':
      return <Fuel className="size-4 text-amber-600" aria-hidden="true" />
    default:
      return <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
  }
}
