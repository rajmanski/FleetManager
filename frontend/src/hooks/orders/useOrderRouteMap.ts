import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { calculateRoute, geocodeAddress } from '@/services/routes'
import type { WaypointOption } from '@/types/waypoints'
import { buildOrderRouteMapPoints, validWaypointCoords } from '@/utils/orderRouteMap'

type UseOrderRouteMapArgs = {
  routeId: number | null | undefined
  startLocation?: string | null
  endLocation?: string | null
  waypoints: WaypointOption[]
  enabled?: boolean
}

export function useOrderRouteMap({
  routeId,
  startLocation,
  endLocation,
  waypoints,
  enabled = true,
}: UseOrderRouteMapArgs) {
  const waypointCoords = useMemo(
    () =>
      waypoints
        .filter(validWaypointCoords)
        .map((w) => ({ lat: w.latitude!, lng: w.longitude! })),
    [waypoints],
  )

  return useQuery({
    queryKey: [
      'orders',
      routeId ?? null,
      'route-map',
      startLocation ?? '',
      endLocation ?? '',
      waypointCoords,
    ],
    queryFn: async () => {
      const start = await geocodeAddress(startLocation!.trim())
      const end = await geocodeAddress(endLocation!.trim())
      const route = await calculateRoute({
        origin: { lat: start.latitude, lng: start.longitude },
        destination: { lat: end.latitude, lng: end.longitude },
        waypoints: waypointCoords,
      })

      return {
        points: buildOrderRouteMapPoints(
          { lat: start.latitude, lng: start.longitude, address: start.address },
          { lat: end.latitude, lng: end.longitude, address: end.address },
          waypoints,
        ),
        polyline: route.polyline,
      }
    },
    enabled:
      enabled &&
      routeId != null &&
      routeId > 0 &&
      Boolean(startLocation?.trim()) &&
      Boolean(endLocation?.trim()),
  })
}
