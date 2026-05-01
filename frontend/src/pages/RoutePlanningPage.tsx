import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { RouteMap } from '@/components/routes/RouteMap'
import { RoutePlanningForm } from '@/components/routes/RoutePlanningForm'
import { useRoutePlanning } from '@/hooks/routes/useRoutePlanning'
import { loadMapsLibrary } from '@/utils/googleMapsLoader'

export default function RoutePlanningPage() {
  const {
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
    calculateRoute,
    handleMapClick,
    showMap,
  } = useRoutePlanning()

  useEffect(() => {
    loadMapsLibrary().catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Route planning (legacy)"
        description="Legacy planning screen for the previous orders → routes → trips flow. For new operations, use the integrated order planning workflow."
      />
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        This page is kept during the transition period. Start new planning in{' '}
        <Link className="font-medium underline" to="/orders/new/planning">
          integrated order planning
        </Link>
        .
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <RoutePlanningForm
          origin={origin}
          setOrigin={setOrigin}
          destination={destination}
          setDestination={setDestination}
          waypoints={waypoints}
          setWaypoints={setWaypoints}
          onCalculate={calculateRoute}
          result={result}
          isCalculating={isCalculating}
          error={error}
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
            className="h-[250px] rounded-md sm:h-[400px] md:h-[500px]"
          />
        ) : (
          <div className="flex h-[250px] flex-col items-center justify-center gap-2 rounded-md bg-gray-50 text-gray-500 sm:h-[400px] md:h-[500px]">
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
