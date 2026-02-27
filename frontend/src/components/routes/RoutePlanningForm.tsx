import { useCallback, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/Button'
import { AddressAutocompleteInput } from './AddressAutocompleteInput'
import {
  calculateRoute,
  geocodeAddress,
  type CalculateResult,
} from '@/services/routes'
import { extractApiError } from '@/utils/api'
import type { MapPoint, WaypointActionType, WaypointState } from '@/types/routes'
import { GripVertical, MapPin, Plus, Trash2 } from 'lucide-react'

const MAX_WAYPOINTS = 10
const ACTION_TYPES: WaypointActionType[] = ['Pickup', 'Dropoff', 'Stopover']

type AddressState = {
  address: string
  lat?: number
  lng?: number
}

function hasCoords(a: AddressState): a is AddressState & { lat: number; lng: number } {
  return typeof a.lat === 'number' && typeof a.lng === 'number'
}

export type RoutePlanningFormProps = {
  origin: AddressState
  setOrigin: (v: AddressState | ((p: AddressState) => AddressState)) => void
  destination: AddressState
  setDestination: (v: AddressState | ((p: AddressState) => AddressState)) => void
  waypoints: WaypointState[]
  setWaypoints: (v: WaypointState[] | ((p: WaypointState[]) => WaypointState[])) => void
  onResult: (result: CalculateResult, points: MapPoint[]) => void
}

function WaypointRow({
  waypoint,
  index,
  onUpdate,
  onRemove,
  disabledRemove,
}: {
  waypoint: WaypointState
  index: number
  onUpdate: (upd: Partial<WaypointState>) => void
  onRemove: () => void
  disabledRemove?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `waypoint-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 rounded-md border border-gray-200 bg-white p-2 ${
        isDragging ? 'z-10 shadow-md' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="mt-8 cursor-grab touch-none rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <AddressAutocompleteInput
          label={`Point ${index + 1}`}
          placeholder="Enter address..."
          value={waypoint.address}
          onSelect={(s) =>
            onUpdate({ address: s.address, lat: s.lat, lng: s.lng })
          }
          onAddressChange={(address) => onUpdate({ address })}
        />
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Type</label>
          <select
            value={waypoint.actionType}
            onChange={(e) =>
              onUpdate({
                actionType: e.target.value as WaypointActionType,
              })
            }
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            {ACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex shrink-0 pt-6">
        <Button
          type="button"
          variant="danger-ghost"
          onClick={onRemove}
          disabled={disabledRemove}
          aria-label="Remove waypoint"
          className="size-9 p-0"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function RoutePlanningForm({
  origin,
  setOrigin,
  destination,
  setDestination,
  waypoints,
  setWaypoints,
  onResult,
}: RoutePlanningFormProps) {
  const [result, setResult] = useState<CalculateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addWaypoint = useCallback(() => {
    setWaypoints((prev) => {
      if (prev.length >= MAX_WAYPOINTS) return prev
      return [...prev, { address: '', actionType: 'Stopover' }]
    })
  }, [setWaypoints])

  const removeWaypoint = useCallback(
    (index: number) => {
      setWaypoints((prev) => prev.filter((_, i) => i !== index))
    },
    [setWaypoints]
  )

  const updateWaypoint = useCallback(
    (index: number, upd: Partial<WaypointState>) => {
      setWaypoints((prev) =>
        prev.map((w, i) => (i === index ? { ...w, ...upd } : w))
      )
    },
    [setWaypoints]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = waypoints.findIndex(
        (_, i) => `waypoint-${i}` === active.id
      )
      const newIndex = waypoints.findIndex((_, i) => `waypoint-${i}` === over.id)
      if (oldIndex >= 0 && newIndex >= 0) {
        setWaypoints(arrayMove(waypoints, oldIndex, newIndex))
      }
    },
    [waypoints, setWaypoints]
  )

  const handleOriginSelect = useCallback(
    (s: { address: string; lat: number; lng: number }) => {
      setOrigin({ address: s.address, lat: s.lat, lng: s.lng })
    },
    [setOrigin]
  )

  const handleDestinationSelect = useCallback(
    (s: { address: string; lat: number; lng: number }) => {
      setDestination({ address: s.address, lat: s.lat, lng: s.lng })
    },
    [setDestination]
  )

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
      const waypointsWithAddress: WaypointState[] = []
      for (const wp of waypoints) {
        if (wp.address.trim()) {
          if (hasCoords(wp)) {
            wpCoords.push({ lat: wp.lat!, lng: wp.lng! })
          } else {
            const g = await geocodeAddress(wp.address)
            wpCoords.push({ lat: g.latitude, lng: g.longitude })
          }
          waypointsWithAddress.push(wp)
        }
      }

      const calcResult = await calculateRoute({
        origin: originCoords,
        destination: destCoords,
        waypoints: wpCoords,
      })

      setResult(calcResult)

      const points: MapPoint[] = [
        { ...originCoords, type: 'Pickup', label: 'Load' },
        ...wpCoords.map((c, i) => ({
          ...c,
          type: waypointsWithAddress[i]?.actionType ?? 'Stopover',
          label: `${waypointsWithAddress[i]?.actionType ?? 'Stopover'} ${i + 1}`,
        })),
        { ...destCoords, type: 'Dropoff', label: 'Drop-off' },
      ]
      onResult(calcResult, points)
    } catch (err) {
      setError(
        extractApiError(err, 'Failed to calculate route.') ?? 'Failed to calculate route.'
      )
    } finally {
      setLoading(false)
    }
  }, [origin, destination, waypoints, onResult])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
          onAddressChange={(address) =>
            setDestination((prev) => ({ ...prev, address }))
          }
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              Intermediate points
            </span>
            {waypoints.length >= MAX_WAYPOINTS && (
              <span className="text-xs text-amber-600">
                Maximum {MAX_WAYPOINTS} waypoints.
              </span>
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
            <span>Add intermediate point</span>
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={waypoints.map((_, i) => `waypoint-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {waypoints.map((wp, idx) => (
                <WaypointRow
                  key={idx}
                  waypoint={wp}
                  index={idx}
                  onUpdate={(upd) => updateWaypoint(idx, upd)}
                  onRemove={() => removeWaypoint(idx)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          onClick={handleCalculate}
          disabled={
            loading || !origin.address.trim() || !destination.address.trim()
          }
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
          <h3 className="mb-2 text-sm font-medium text-gray-700">
            Route result
          </h3>
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
