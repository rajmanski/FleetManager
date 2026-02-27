import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { RouteMap } from '@/components/routes/RouteMap'
import { RoutePlanningForm } from '@/components/routes/RoutePlanningForm'
import { loadMapsLibrary } from '@/utils/googleMapsLoader'
import { reverseGeocode } from '@/utils/googleMapsLoader'
import type { CalculateResult } from '@/services/routes'
import type { MapPoint, WaypointState } from '@/types/routes'

type AddressState = {
  address: string
  lat?: number
  lng?: number
}

export default function RoutePlanningPage() {
  const [origin, setOrigin] = useState<AddressState>({ address: '' })
  const [destination, setDestination] = useState<AddressState>({ address: '' })
  const [waypoints, setWaypoints] = useState<WaypointState[]>([])
  const [points, setPoints] = useState<MapPoint[]>([])
  const [polyline, setPolyline] = useState<string | undefined>(undefined)
  const hasShownMapRef = useRef(false)

  useEffect(() => {
    loadMapsLibrary().catch(() => {})
  }, [])

  const handleResult = useCallback((result: CalculateResult, pts: MapPoint[]) => {
    setPoints(pts)
    setPolyline(result.polyline)
    hasShownMapRef.current = true
  }, [])

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (waypoints.length >= 10) return
      const result = await reverseGeocode(lat, lng)
      const address = result?.address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setWaypoints((prev) => [
        ...prev,
        { address, lat, lng, actionType: 'Stopover' },
      ])
    },
    [waypoints.length]
  )

  const showMap = hasShownMapRef.current || points.length >= 2

  return (
    <div className="space-y-6">
      <PageHeader
        title="Route planning"
        description="Enter load and drop-off addresses to calculate the route. Click on the map to add intermediate points."
      />
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <RoutePlanningForm
          origin={origin}
          setOrigin={setOrigin}
          destination={destination}
          setDestination={setDestination}
          waypoints={waypoints}
          setWaypoints={setWaypoints}
          onResult={handleResult}
        />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {showMap ? (
          <RouteMap
            key="route-map"
            center={{ lat: 52.2297, lng: 21.0122 }}
            zoom={5}
            points={points}
            polyline={polyline}
            onMapClick={handleMapClick}
            className="h-[500px] rounded-md"
          />
        ) : (
          <div className="flex h-[500px] flex-col items-center justify-center gap-2 rounded-md bg-gray-50 text-gray-500">
            <span>Enter addresses and click "Calculate route" to see the map</span>
            <span className="text-sm">
              You can then click on the map to add intermediate points
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
