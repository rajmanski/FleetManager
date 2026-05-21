import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import type { WaypointOption } from '@/types/waypoints'
import { DESTINATION_DROPFF_ID } from '@/hooks/orders/planning/orderPlanningFlowData'

export function useOrderWaypoints(routeId: number | null | undefined, endLocation?: string | null) {
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
  const dropoffOptions = (() => {
    const opts: WaypointOption[] = waypoints.filter(
      (w) => w.actionType === 'Dropoff' || w.actionType === 'Stopover'
    )
    if (endLocation?.trim()) {
      opts.push({
        id: DESTINATION_DROPFF_ID,
        address: `Final destination: ${endLocation.trim()}`,
        actionType: 'Dropoff',
      })
    }
    return opts
  })()

  return {
    waypointsQuery,
    waypoints,
    dropoffOptions,
    routeId: effectiveRouteId,
    isLoading: waypointsQuery.isLoading,
  }
}
