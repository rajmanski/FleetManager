import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export function useOrderWaypoints(routeId: number | null | undefined) {
  const effectiveRouteId = routeId ?? null

  type ApiWaypoint = {
    waypoint_id: number
    address: string
    action_type: string
    sequence_order: number
    latitude?: number
    longitude?: number
  }

  const waypointsQuery = useQuery({
    queryKey: ['routes', effectiveRouteId, 'waypoints'],
    queryFn: async () => {
      if (!effectiveRouteId) return []
      const res = await api.get<ApiWaypoint[]>(
        `/api/v1/routes/${effectiveRouteId}/waypoints`
      )
      const raw = Array.isArray(res.data) ? res.data : []
      const mapped = raw.map((w) => ({
        id: w.waypoint_id,
        address: w.address,
        actionType: w.action_type,
        sequenceOrder: w.sequence_order,
        latitude: w.latitude,
        longitude: w.longitude,
      }))
      return mapped.sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    },
    enabled: effectiveRouteId != null && effectiveRouteId > 0,
  })

  const waypoints = waypointsQuery.data ?? []
  const dropoffOptions = waypoints.filter(
    (w) => w.actionType === 'Dropoff' || w.actionType === 'Stopover'
  )

  return {
    waypointsQuery,
    waypoints,
    dropoffOptions,
    routeId: effectiveRouteId,
    isLoading: waypointsQuery.isLoading,
  }
}
