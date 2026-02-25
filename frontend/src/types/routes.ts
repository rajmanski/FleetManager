export type WaypointActionType = 'Pickup' | 'Dropoff' | 'Stopover'

export interface MapPoint {
  lat: number
  lng: number
  type?: WaypointActionType
  label?: string
}

export interface RouteMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  points?: MapPoint[]
  polyline?: string
  className?: string
}
