import { useCallback, useRef, useState } from 'react'
import {
  calculateRoute as calculateRouteApi,
  geocodeAddress,
  type CalculateResult,
} from '@/services/routes'
import { reverseGeocode } from '@/utils/googleMapsLoader'
import { extractApiError } from '@/utils/api'
import type {
  AddressState,
  MapPoint,
  WaypointState,
} from '@/types/routes'

export const MAX_WAYPOINTS = 10

function hasCoords(
  a: AddressState
): a is AddressState & { lat: number; lng: number } {
  return typeof a.lat === 'number' && typeof a.lng === 'number'
}

function isValidCoord(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v)
}

async function resolveCoords(
  addr: AddressState
): Promise<{ lat: number; lng: number }> {
  if (hasCoords(addr) && isValidCoord(addr.lat) && isValidCoord(addr.lng)) {
    return { lat: addr.lat, lng: addr.lng }
  }
  const g = await geocodeAddress(addr.address)
  if (!isValidCoord(g.latitude) || !isValidCoord(g.longitude)) {
    throw new Error(
      addr.address.trim()
        ? `Geocoding failed for: ${addr.address}`
        : 'Geocoding returned invalid coordinates'
    )
  }
  return { lat: g.latitude, lng: g.longitude }
}

function buildMapPoints(
  originCoords: { lat: number; lng: number },
  destCoords: { lat: number; lng: number },
  wpCoords: Array<{ lat: number; lng: number }>,
  waypointsWithAddress: WaypointState[]
): MapPoint[] {
  return [
    { ...originCoords, type: 'Pickup', label: 'Load' },
    ...wpCoords.map((c, i) => ({
      ...c,
      type: waypointsWithAddress[i]?.actionType ?? 'Stopover',
      label: `${waypointsWithAddress[i]?.actionType ?? 'Stopover'} ${i + 1}`,
    })),
    { ...destCoords, type: 'Dropoff', label: 'Drop-off' },
  ]
}

export type UseRoutePlanningReturn = {
  origin: AddressState
  setOrigin: (v: AddressState | ((p: AddressState) => AddressState)) => void
  destination: AddressState
  setDestination: (
    v: AddressState | ((p: AddressState) => AddressState)
  ) => void
  waypoints: WaypointState[]
  setWaypoints: (
    v: WaypointState[] | ((p: WaypointState[]) => WaypointState[])
  ) => void
  points: MapPoint[]
  polyline: string | undefined
  result: CalculateResult | null
  isCalculating: boolean
  error: string | null
  calculateRoute: () => Promise<void>
  handleMapClick: (lat: number, lng: number) => Promise<void>
  showMap: boolean
}

export function useRoutePlanning(): UseRoutePlanningReturn {
  const [origin, setOrigin] = useState<AddressState>({ address: '' })
  const [destination, setDestination] = useState<AddressState>({ address: '' })
  const [waypoints, setWaypoints] = useState<WaypointState[]>([])
  const [points, setPoints] = useState<MapPoint[]>([])
  const [polyline, setPolyline] = useState<string | undefined>(undefined)
  const [result, setResult] = useState<CalculateResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const latestRef = useRef({ origin, destination, waypoints })
  latestRef.current = { origin, destination, waypoints }

  const showMap = points.length >= 2

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (waypoints.length >= MAX_WAYPOINTS) return
      const geocodeResult = await reverseGeocode(lat, lng)
      const address =
        geocodeResult?.address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setWaypoints((prev) => [
        ...prev,
        { address, lat, lng, actionType: 'Stopover' },
      ])
    },
    [waypoints.length]
  )

  const calculateRouteCallback = useCallback(async () => {
    setError(null)
    const { origin: o, destination: d, waypoints: wps } = latestRef.current
    if (!o.address.trim() || !d.address.trim()) {
      setError('Please fill in both load and drop-off addresses.')
      return
    }

    setIsCalculating(true)
    try {
      const originCoords = await resolveCoords(o)
      const destCoords = await resolveCoords(d)

      const wpCoords: Array<{ lat: number; lng: number }> = []
      const waypointsWithAddress: WaypointState[] = []
      for (const wp of wps) {
        if (wp.address.trim()) {
          wpCoords.push(await resolveCoords(wp))
          waypointsWithAddress.push(wp)
        }
      }

      const calcResult = await calculateRouteApi({
        origin: originCoords,
        destination: destCoords,
        waypoints: wpCoords,
      })

      setResult(calcResult)
      const pts = buildMapPoints(
        originCoords,
        destCoords,
        wpCoords,
        waypointsWithAddress
      )
      setPoints(pts)
      setPolyline(calcResult.polyline)
    } catch (err) {
      const msg =
        extractApiError(err, 'Failed to calculate route.') ??
        (err instanceof Error ? err.message : 'Failed to calculate route.')
      setError(msg)
    } finally {
      setIsCalculating(false)
    }
  }, [])

  return {
    origin,
    setOrigin,
    destination,
    setDestination,
    waypoints,
    setWaypoints,
    points,
    polyline,
    result,
    isCalculating,
    error,
    calculateRoute: calculateRouteCallback,
    handleMapClick,
    showMap,
  }
}
