export type WaypointActionType = 'Pickup' | 'Dropoff' | 'Stopover'

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
}

export interface RouteMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  points?: MapPoint[]
  polyline?: string
  className?: string
  onMapClick?: (lat: number, lng: number) => void
}
