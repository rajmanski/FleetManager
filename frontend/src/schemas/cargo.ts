export const CARGO_TYPES = ['General', 'Refrigerated', 'Hazardous'] as const
export type CargoType = (typeof CARGO_TYPES)[number]

export type CargoItemDraft = {
  id: string
  description: string
  quantity: string
  weightPerUnitKg: string
  volumePerUnitM3: string
  cargoType: CargoType
  destinationWaypointId?: number | null
  destinationWaypointTempId?: string | null
}

export const EMPTY_CARGO_ITEM: Omit<CargoItemDraft, 'id'> = {
  description: '',
  quantity: '1',
  weightPerUnitKg: '',
  volumePerUnitM3: '',
  cargoType: 'General',
  destinationWaypointId: null,
  destinationWaypointTempId: null,
}

export type CargoPayload = {
  description: string
  weightKg: number
  volumeM3: number
  cargoType: CargoType
  destinationWaypointId?: number | null
}
