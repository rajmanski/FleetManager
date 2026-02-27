import { useEffect } from 'react'
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
