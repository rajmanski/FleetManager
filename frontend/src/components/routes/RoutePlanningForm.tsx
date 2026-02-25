import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AddressAutocompleteInput } from './AddressAutocompleteInput'
import {
  calculateRoute,
  geocodeAddress,
  type CalculateResult,
} from '@/services/routes'
import { extractApiError } from '@/utils/api'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import type { MapPoint, WaypointActionType } from '@/types/routes'

const MAX_WAYPOINTS = 10

type AddressState = {
  address: string
  lat?: number
  lng?: number
}

function hasCoords(a: AddressState): a is AddressState & { lat: number; lng: number } {
  return typeof a.lat === 'number' && typeof a.lng === 'number'
}

export type RoutePlanningFormProps = {
  onResult: (result: CalculateResult, points: MapPoint[]) => void
}

export function RoutePlanningForm({ onResult }: RoutePlanningFormProps) {
  const [origin, setOrigin] = useState<AddressState>({ address: '' })
  const [destination, setDestination] = useState<AddressState>({ address: '' })
  const [waypoints, setWaypoints] = useState<AddressState[]>([])
  const [result, setResult] = useState<CalculateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addWaypoint = useCallback(() => {
    if (waypoints.length >= MAX_WAYPOINTS) return
    setWaypoints((prev) => [...prev, { address: '' }])
  }, [waypoints.length])

  const removeWaypoint = useCallback((index: number) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateWaypoint = useCallback((index: number, upd: Partial<AddressState>) => {
    setWaypoints((prev) =>
      prev.map((w, i) => (i === index ? { ...w, ...upd } : w))
    )
  }, [])

  const handleOriginSelect = useCallback((s: { address: string; lat: number; lng: number }) => {
    setOrigin({ address: s.address, lat: s.lat, lng: s.lng })
  }, [])
  const handleDestinationSelect = useCallback((s: { address: string; lat: number; lng: number }) => {
    setDestination({ address: s.address, lat: s.lat, lng: s.lng })
  }, [])

  const handleCalculate = useCallback(async () => {
    setError(null)
    if (!origin.address.trim() || !destination.address.trim()) {
      setError('Please fill in both load and drop-off addresses.')
      return
    }

    setLoading(true)

    try {
      let originCoords = { lat: origin.lat!, lng: origin.lng! }
      let destCoords = { lat: destination.lat!, lng: destination.lng! }
      const wpCoords: Array<{ lat: number; lng: number }> = []

      if (!hasCoords(origin)) {
        const g = await geocodeAddress(origin.address)
        originCoords = { lat: g.latitude, lng: g.longitude }
      }
      if (!hasCoords(destination)) {
        const g = await geocodeAddress(destination.address)
        destCoords = { lat: g.latitude, lng: g.longitude }
      }
      for (const wp of waypoints) {
        if (wp.address.trim()) {
          if (hasCoords(wp)) {
            wpCoords.push({ lat: wp.lat, lng: wp.lng })
          } else {
            const g = await geocodeAddress(wp.address)
            wpCoords.push({ lat: g.latitude, lng: g.longitude })
          }
        }
      }

      const calcResult = await calculateRoute({
        origin: originCoords,
        destination: destCoords,
        waypoints: wpCoords,
      })

      setResult(calcResult)

      const points: MapPoint[] = [
        { ...originCoords, type: 'Pickup' as WaypointActionType, label: 'Load' },
        ...wpCoords.map((p, i): MapPoint => ({
          ...p,
          type: 'Stopover' as WaypointActionType,
          label: `Waypoint ${i + 1}`,
        })),
        { ...destCoords, type: 'Dropoff' as WaypointActionType, label: 'Drop-off' },
      ]
      onResult(calcResult, points)
    } catch (err) {
      setError(extractApiError(err, 'Failed to calculate route.') ?? 'Failed to calculate route.')
    } finally {
      setLoading(false)
    }
  }, [origin, destination, waypoints, onResult])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        <AddressAutocompleteInput
          label="Load address"
          placeholder="Enter load address..."
          value={origin.address}
          required
          onSelect={handleOriginSelect}
          onAddressChange={(address) => setOrigin((prev) => ({ ...prev, address }))}
        />
        <AddressAutocompleteInput
          label="Drop-off address"
          placeholder="Enter drop-off address..."
          value={destination.address}
          required
          onSelect={handleDestinationSelect}
          onAddressChange={(address) => setDestination((prev) => ({ ...prev, address }))}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Waypoints</span>
            {waypoints.length >= MAX_WAYPOINTS && (
              <span className="text-xs text-amber-600">Maximum {MAX_WAYPOINTS} waypoints.</span>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={addWaypoint}
            disabled={waypoints.length >= MAX_WAYPOINTS}
            className="inline-flex items-center py-2.5"
          >
            <Plus className="mr-1.5 size-4 shrink-0" />
            <span>Add waypoint</span>
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {waypoints.map((wp, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <AddressAutocompleteInput
                  label={`Waypoint ${idx + 1}`}
                  placeholder="Enter address..."
                  value={wp.address}
                  onSelect={(s) => updateWaypoint(idx, { address: s.address, lat: s.lat, lng: s.lng })}
                  onAddressChange={(address) => updateWaypoint(idx, { address })}
                />
              </div>
              <div className="flex shrink-0 pt-6">
                <Button
                  type="button"
                  variant="danger-ghost"
                  onClick={() => removeWaypoint(idx)}
                  aria-label="Remove waypoint"
                  className="size-9 p-0"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          onClick={handleCalculate}
          disabled={loading || !origin.address.trim() || !destination.address.trim()}
          className="inline-flex items-center"
        >
          <MapPin className="mr-2 size-4 shrink-0" />
          <span>{loading ? 'Calculating...' : 'Calculate route'}</span>
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
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
      )}
    </div>
  )
}
