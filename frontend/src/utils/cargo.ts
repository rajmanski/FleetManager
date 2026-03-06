import type { CargoItemDraft, CargoPayload } from '@/schemas/cargo'

export type CargoItemErrors = {
  weightPerUnitKg?: string
  volumePerUnitM3?: string
  quantity?: string
}

export function parseCargoDraftsToPayloads(items: CargoItemDraft[]): {
  payloads: CargoPayload[]
  errors: Record<string, CargoItemErrors>
} {
  const errors: Record<string, CargoItemErrors> = {}
  const payloads: CargoPayload[] = []

  for (const item of items) {
    const quantity = parseInt(String(item.quantity), 10)
    const weightPerUnit = parseFloat(String(item.weightPerUnitKg))
    const volumePerUnit = parseFloat(String(item.volumePerUnitM3))

    const itemErr: CargoItemErrors = {}
    if (!Number.isFinite(quantity) || quantity < 1) {
      itemErr.quantity = 'Quantity must be at least 1'
    }
    if (!Number.isFinite(weightPerUnit) || weightPerUnit <= 0) {
      itemErr.weightPerUnitKg = 'Weight per unit must be greater than 0'
    }
    if (!Number.isFinite(volumePerUnit) || volumePerUnit <= 0) {
      itemErr.volumePerUnitM3 = 'Volume per unit must be greater than 0'
    }
    if (Object.keys(itemErr).length > 0) {
      errors[item.id] = itemErr
    } else {
      const qty = quantity
      const totalWeight = qty * weightPerUnit
      const totalVolume = qty * volumePerUnit
      let description = (item.description ?? '').trim()
      if (description && qty > 1) {
        description = `${qty} × ${description}`
      }
      payloads.push({
        description: description || `${qty} items`,
        weightKg: totalWeight,
        volumeM3: totalVolume,
        cargoType: item.cargoType,
        destinationWaypointId: item.destinationWaypointId ?? null,
      })
    }
  }

  return { payloads, errors }
}

export function computeCargoTotals(items: CargoItemDraft[]): {
  totalWeightKg: number
  totalVolumeM3: number
} {
  let totalWeightKg = 0
  let totalVolumeM3 = 0

  for (const item of items) {
    const qty = parseInt(String(item.quantity), 10) || 0
    const w = parseFloat(String(item.weightPerUnitKg))
    const v = parseFloat(String(item.volumePerUnitM3))
    if (qty > 0 && Number.isFinite(w) && w > 0) {
      totalWeightKg += qty * w
    }
    if (qty > 0 && Number.isFinite(v) && v > 0) {
      totalVolumeM3 += qty * v
    }
  }

  return { totalWeightKg, totalVolumeM3 }
}

export function generateCargoId(): string {
  return `cargo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
