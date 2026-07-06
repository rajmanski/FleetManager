import type { Driver } from '@/hooks/drivers/useDrivers'
import type { CargoItemDraft } from '@/schemas/cargo'
import type { CargoItemErrors } from '@/utils/cargo'

export function isDriverAdrValid(driver?: Driver): boolean {
  if (!driver?.adr_certified) {
    return false
  }
  if (!driver.adr_expiry_date) {
    return true
  }
  const expiry = new Date(driver.adr_expiry_date)
  if (Number.isNaN(expiry.getTime())) {
    return false
  }
  return expiry >= new Date()
}

export function computeTotalWeightKg(items: CargoItemDraft[]): number {
  let total = 0
  for (const item of items) {
    const qty = parseInt(String(item.quantity), 10) || 0
    const weight = parseFloat(String(item.weightPerUnitKg))
    if (qty > 0 && Number.isFinite(weight) && weight > 0) {
      total += qty * weight
    }
  }
  return total
}

export function hasHazardousCargo(items: CargoItemDraft[]): boolean {
  return items.some((item) => item.cargoType === 'Hazardous')
}

export function mapCargoItemErrors(
  cargoErrors: unknown,
  cargoItems?: CargoItemDraft[],
): Record<string, CargoItemErrors> {
  if (!Array.isArray(cargoErrors) || !cargoItems) {
    return {}
  }

  const out: Record<string, CargoItemErrors> = {}
  cargoItems.forEach((item, idx) => {
    const ce = cargoErrors[idx]
    if (!item?.id || !ce || typeof ce !== 'object') {
      return
    }
    const row = ce as Record<string, { message?: string } | undefined>
    out[item.id] = {
      quantity: row.quantity?.message,
      weightPerUnitKg: row.weightPerUnitKg?.message,
      volumePerUnitM3: row.volumePerUnitM3?.message,
    }
  })

  return out
}

export function buildWaypointDropoffOptions(
  waypoints: Array<{ tempId?: string; address: string; actionType: string }>,
) {
  return waypoints
    .filter((waypoint) => {
      return waypoint.actionType === 'Dropoff' || waypoint.actionType === 'Stopover'
    })
    .map((waypoint, index) => ({
      id: waypoint.tempId ?? `missing-${index}`,
      address: waypoint.address.trim() || `Waypoint ${index + 1}`,
      actionType: waypoint.actionType,
    }))
}
