import { useEffect, type Dispatch, type SetStateAction } from 'react'
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form'
import { loadMapsLibrary } from '@/utils/googleMapsLoader'
import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'
import type { WaypointState } from '@/types/routes'

type Args = {
  waypoints: WaypointState[]
  setWaypoints: Dispatch<SetStateAction<WaypointState[]>>
  getValues: UseFormGetValues<OrderPlanningFormValues>
  setValue: UseFormSetValue<OrderPlanningFormValues>
}

export function useOrderPlanningRouteEffects({
  waypoints,
  setWaypoints,
  getValues,
  setValue,
}: Args) {
  useEffect(() => {
    loadMapsLibrary().catch(() => {})
  }, [])

  useEffect(() => {
    setWaypoints((prev) => {
      let changed = false
      const next = prev.map((waypoint) => {
        if (waypoint.tempId) {
          return waypoint
        }
        changed = true
        return {
          ...waypoint,
          tempId:
            globalThis.crypto?.randomUUID?.() ??
            `wp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        }
      })
      return changed ? next : prev
    })
  }, [waypoints, setWaypoints])

  useEffect(() => {
    const validTempIds = new Set(
      waypoints
        .map((waypoint) => waypoint.tempId?.trim())
        .filter((id): id is string => Boolean(id)),
    )
    const cargo = getValues('cargo')
    let changed = false
    const next = cargo.map((item) => {
      const tempId = item.destinationWaypointTempId?.trim()
      if (tempId && !validTempIds.has(tempId)) {
        changed = true
        return { ...item, destinationWaypointTempId: null }
      }
      return item
    })
    if (changed) {
      setValue('cargo', next, { shouldValidate: true })
    }
  }, [waypoints, getValues, setValue])
}

