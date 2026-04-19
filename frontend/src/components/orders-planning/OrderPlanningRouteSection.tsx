import { RouteMap } from '@/components/routes/RouteMap'
import { RoutePlanningForm } from '@/components/routes/RoutePlanningForm'
import type { UseRoutePlanningReturn } from '@/hooks/routes/useRoutePlanning'

type OrderPlanningRouteSectionProps = Pick<
  UseRoutePlanningReturn,
  | 'origin'
  | 'setOrigin'
  | 'destination'
  | 'setDestination'
  | 'waypoints'
  | 'setWaypoints'
  | 'points'
  | 'polyline'
  | 'result'
  | 'isCalculating'
  | 'error'
  | 'calculateRoute'
  | 'handleMapClick'
  | 'showMap'
>

export function OrderPlanningRouteSection({
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
}: OrderPlanningRouteSectionProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">
        Route and waypoints
      </h2>
      <p className="mb-3 text-sm text-gray-600">
        Add at least one intermediate waypoint. Click &quot;Calculate route&quot;
        before submitting the workflow.
      </p>
      <RoutePlanningForm
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        waypoints={waypoints}
        setWaypoints={setWaypoints}
        onCalculate={() => void calculateRoute()}
        result={result}
        isCalculating={isCalculating}
        error={error}
      />
      <div className="mt-4">
        {showMap ? (
          <RouteMap
            key="order-plan-map"
            center={{ lat: 52.2297, lng: 21.0122 }}
            zoom={5}
            points={points}
            polyline={polyline}
            onMapClick={handleMapClick}
            className="h-[420px] rounded-md"
          />
        ) : (
          <div className="flex h-[420px] flex-col items-center justify-center gap-2 rounded-md bg-gray-50 text-gray-500">
            <span>
              Enter load and drop-off addresses, add waypoints, then calculate
              the route.
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
