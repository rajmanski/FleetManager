import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/Button'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { AddressAutocompleteInput } from './AddressAutocompleteInput'
import type { WaypointActionType, WaypointState } from '@/types/routes'
import { GripVertical, Trash2 } from 'lucide-react'

const ACTION_TYPES: WaypointActionType[] = ['Pickup', 'Dropoff', 'Stopover']

export type WaypointRowProps = {
  waypoint: WaypointState
  index: number
  onUpdate: (upd: Partial<WaypointState>) => void
  onRemove: () => void
  disabledRemove?: boolean
}

export function WaypointRow({
  waypoint,
  index,
  onUpdate,
  onRemove,
  disabledRemove,
}: WaypointRowProps) {
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
        <FilterSelect
          label="Type"
          value={waypoint.actionType}
          onChange={(v) => onUpdate({ actionType: v as WaypointActionType })}
          options={ACTION_TYPES}
          allowEmpty={false}
        />
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
