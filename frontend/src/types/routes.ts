export type WaypointActionType = 'Pickup' | 'Dropoff' | 'Stopover'

export type AddressState = {
  address: string
  lat?: number
  lng?: number
}

export type AddressWithCoords = {
  address: string
  lat: number
  lng: number
}

export interface MapPoint {
  lat: number
  lng: number
  type?: WaypointActionType
  label?: string
}

export interface WaypointState {
  address: string
  lat?: number
  lng?: number
  actionType: WaypointActionType
  tempId?: string
}

export interface RouteMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  points?: MapPoint[]
  polyline?: string
  className?: string
  onMapClick?: (lat: number, lng: number) => void
}
