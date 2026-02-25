import { PageHeader } from '@/components/ui/PageHeader'
import { RouteMap } from '@/components/routes/RouteMap'

export default function RoutePlanningPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Route Planning" description="Interactive map with pickup and drop-off points" />
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <RouteMap
          center={{ lat: 52.2297, lng: 21.0122 }}
          zoom={6}
          points={[
            { lat: 52.2297, lng: 21.0122, type: 'Pickup', label: 'Warsaw - pickup' },
            { lat: 50.0647, lng: 19.945, type: 'Dropoff', label: 'Krakow - drop-off' },
          ]}
          className="h-[500px] rounded-md"
        />
      </div>
      <p className="text-sm text-gray-500">
        Interactive map with pickup, drop-off and waypoint markers and route.
        Route planning form will be added in a future task (E5.5).
      </p>
    </div>
  )
}
