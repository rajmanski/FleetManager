import { useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { CargoItemRow } from '@/components/orders/CargoItemRow'
import type { WaypointOption } from '@/types/waypoints'
import { CargoTotalsBar } from '@/components/orders/CargoTotalsBar'
import { EMPTY_CARGO_ITEM } from '@/schemas/cargo'
import { type CargoItemDraft } from '@/schemas/cargo'
import {
  computeCargoTotals,
  generateCargoId,
  type CargoItemErrors,
} from '@/utils/cargo'
import { Plus } from 'lucide-react'

type CargoSectionProps = {
  items: CargoItemDraft[]
  onChange: (items: CargoItemDraft[]) => void
  waypoints?: WaypointOption[]
  itemErrors?: Record<string, CargoItemErrors>
}

export type { WaypointOption }

export function CargoSection({
  items,
  onChange,
  waypoints = [],
  itemErrors = {},
}: CargoSectionProps) {
  const addItem = useCallback(() => {
    onChange([
      ...items,
      { ...EMPTY_CARGO_ITEM, id: generateCargoId() },
    ])
  }, [items, onChange])

  const removeItem = useCallback(
    (id: string) => {
      onChange(items.filter((i) => i.id !== id))
    },
    [items, onChange]
  )

  const updateItem = useCallback(
    (id: string, updates: Partial<CargoItemDraft>) => {
      onChange(
        items.map((i) => (i.id === id ? { ...i, ...updates } : i))
      )
    },
    [items, onChange]
  )

  const dropoffOptions = waypoints.filter(
    (w) => w.actionType === 'Dropoff' || w.actionType === 'Stopover'
  )

  const { totalWeightKg, totalVolumeM3 } = computeCargoTotals(items)
  const hasHazardous = items.some((i) => i.cargoType === 'Hazardous')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Cargo</h3>
        <Button
          type="button"
          variant="secondary"
          onClick={addItem}
          className="inline-flex shrink-0 items-center whitespace-nowrap"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add cargo
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">
          No cargo items. Click &quot;Add cargo&quot; to add one.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <CargoItemRow
              key={item.id}
              item={item}
              onUpdate={(updates) => updateItem(item.id, updates)}
              onRemove={() => removeItem(item.id)}
              dropoffOptions={dropoffOptions}
              errors={itemErrors[item.id]}
            />
          ))}

          <CargoTotalsBar
            totalWeightKg={totalWeightKg}
            totalVolumeM3={totalVolumeM3}
            hasHazardous={hasHazardous}
          />
        </div>
      )}
    </div>
  )
}
