import type { MapPoint } from '@/types/routes'
import type { WaypointOption } from '@/hooks/orders/useOrderWaypoints'

type Endpoint = {
  lat: number
  lng: number
  address: string
}

export function validWaypointCoords(waypoint: WaypointOption) {
  return (
    waypoint.latitude != null &&
    waypoint.longitude != null &&
    (waypoint.latitude !== 0 || waypoint.longitude !== 0)
  )
}

export function buildOrderRouteMapPoints(
  start: Endpoint,
  end: Endpoint,
  waypoints: WaypointOption[],
): MapPoint[] {
  return [
    {
      lat: start.lat,
      lng: start.lng,
      type: 'Pickup',
      label: `Start: ${start.address}`,
    },
    ...waypoints.filter(validWaypointCoords).map((waypoint) => ({
      lat: waypoint.latitude!,
      lng: waypoint.longitude!,
      type: waypoint.actionType as MapPoint['type'],
      label: waypoint.address.trim() || `${waypoint.actionType} ${waypoint.id}`,
    })),
    {
      lat: end.lat,
      lng: end.lng,
      type: 'Dropoff',
      label: `End: ${end.address}`,
    },
  ]
}
