import { useCallback } from 'react'
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { AddressAutocompleteInput } from './AddressAutocompleteInput'
import { RouteResultCard } from './RouteResultCard'
import { WaypointRow } from './WaypointRow'
import { MAX_WAYPOINTS } from '@/hooks/routes/useRoutePlanning'
import type { AddressState, WaypointState } from '@/types/routes'
import type { CalculateResult } from '@/services/routes'
import { MapPin, Plus } from 'lucide-react'

export type RoutePlanningFormProps = {
  origin: AddressState
  setOrigin: (v: AddressState | ((p: AddressState) => AddressState)) => void
  destination: AddressState
  setDestination: (v: AddressState | ((p: AddressState) => AddressState)) => void
  waypoints: WaypointState[]
  setWaypoints: (
    v: WaypointState[] | ((p: WaypointState[]) => WaypointState[])
  ) => void
  onCalculate: () => void
  result: CalculateResult | null
  isCalculating: boolean
  error: string | null
}

export function RoutePlanningForm({
  origin,
  setOrigin,
  destination,
  setDestination,
  waypoints,
  setWaypoints,
  onCalculate,
  result,
  isCalculating,
  error,
}: RoutePlanningFormProps) {
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
          onClick={onCalculate}
          disabled={
            isCalculating || !origin.address.trim() || !destination.address.trim()
          }
          className="inline-flex items-center"
        >
          <MapPin className="mr-2 size-4 shrink-0" />
          <span>{isCalculating ? 'Calculating...' : 'Calculate route'}</span>
        </Button>
      </div>

      <ErrorMessage message={error} variant="soft" />

      {result && <RouteResultCard result={result} />}
    </div>
  )
}
