import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { RouteMap } from '@/components/routes/RouteMap'
import { RoutePlanningForm } from '@/components/routes/RoutePlanningForm'
import { loadMapsLibrary } from '@/utils/googleMapsLoader'
import type { CalculateResult } from '@/services/routes'
import type { MapPoint } from '@/types/routes'

export default function RoutePlanningPage() {
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

  const showMap = hasShownMapRef.current || points.length >= 2

  return (
    <div className="space-y-6">
      <PageHeader
        title="Route planning"
        description="Enter load and drop-off addresses to calculate the route"
      />
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <RoutePlanningForm onResult={handleResult} />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {showMap ? (
          <RouteMap
            key="route-map"
            center={{ lat: 52.2297, lng: 21.0122 }}
            zoom={5}
            points={points}
            polyline={polyline}
            className="h-[500px] rounded-md"
          />
        ) : (
          <div className="flex h-[500px] flex-col items-center justify-center gap-2 rounded-md bg-gray-50 text-gray-500">
            <span>Enter addresses and click "Calculate route" to see the map</span>
          </div>
        )}
      </div>
    </div>
  )
}
