import type { CalculateResult } from '@/services/routes'

type RouteResultCardProps = {
  result: CalculateResult
}

export function RouteResultCard({ result }: RouteResultCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-2 text-sm font-medium text-gray-700">Route result</h3>
      <div className="flex flex-wrap gap-6">
        <div>
          <span className="text-xs text-gray-500">Distance</span>
          <p className="text-lg font-semibold text-slate-700">
            {result.distance_km.toFixed(1)} km
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Estimated time</span>
          <p className="text-lg font-semibold text-slate-700">
            {result.duration_minutes} min
          </p>
        </div>
      </div>
    </div>
  )
}
