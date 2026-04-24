import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CARGO_TYPES, type CargoItemDraft, type CargoType } from '@/schemas/cargo'
import { Trash2 } from 'lucide-react'
import type { CargoItemErrors } from '@/utils/cargo'

export type WaypointOption = {
  id: number | string
  address: string
  actionType: string
}

type CargoItemRowProps = {
  item: CargoItemDraft
  onUpdate: (updates: Partial<CargoItemDraft>) => void
  onRemove: () => void
  dropoffOptions: WaypointOption[]
  errors?: CargoItemErrors
}

export function CargoItemRow({
  item,
  onUpdate,
  onRemove,
  dropoffOptions,
  errors = {},
}: CargoItemRowProps) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50/50 p-3">
      <div className="mb-1.5 flex justify-end">
        <Button
          type="button"
          variant="danger-ghost"
          onClick={onRemove}
          title="Remove cargo"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-2 md:flex-row md:flex-nowrap md:items-start md:gap-2">
        <div className="min-w-0 w-full max-w-full md:max-w-[7ch] md:shrink-0">
          <Input
            label="Qty"
            type="number"
            variant="numeric"
            required
            error={errors.quantity}
            min={1}
            value={item.quantity}
            onChange={(e) => onUpdate({ quantity: e.target.value })}
            placeholder="1"
          />
        </div>
        <div className="min-w-0 w-full max-w-full md:max-w-[14ch] md:shrink-0">
          <Input
            label="Vol. (m³)"
            type="number"
            variant="numericDecimal"
            required
            error={errors.volumePerUnitM3}
            step={1}
            min={0}
            value={item.volumePerUnitM3}
            onChange={(e) => onUpdate({ volumePerUnitM3: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="min-w-0 w-full max-w-full md:max-w-[14ch] md:shrink-0">
          <Input
            label="Weight (kg)"
            type="number"
            variant="numericDecimal"
            required
            error={errors.weightPerUnitKg}
            step={1}
            min={0}
            value={item.weightPerUnitKg}
            onChange={(e) => onUpdate({ weightPerUnitKg: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="min-w-0 w-full max-w-full md:max-w-[8.5rem] md:shrink-0">
          <Select
            label="Type"
            required
            variant="compact"
            options={CARGO_TYPES}
            value={item.cargoType}
            onChange={(e) => onUpdate({ cargoType: e.target.value as CargoType })}
            className="w-full min-w-0"
          />
        </div>
        <div className="min-w-0 w-full flex-1 md:min-w-[12rem]">
          <Input
            label="Description"
            variant="compact"
            value={item.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="e.g. Palety z elektroniką"
          />
        </div>
      </div>
      {dropoffOptions.length > 0 && (
        <div className="mt-2">
          <Select
            label="Dropoff point (optional)"
            variant="compact"
            options={dropoffOptions.map((w) => ({
              value: String(w.id),
              label: w.address,
            }))}
            allowEmpty
            emptyLabel="No specific point"
            value={
              item.destinationWaypointTempId ??
              (item.destinationWaypointId != null
                ? String(item.destinationWaypointId)
                : '')
            }
            onChange={(e) => {
              const v = e.target.value
              if (v === '') {
                onUpdate({
                  destinationWaypointId: null,
                  destinationWaypointTempId: null,
                })
                return
              }
              const match = dropoffOptions.find((o) => String(o.id) === v)
              if (!match) return
              if (typeof match.id === 'string') {
                onUpdate({
                  destinationWaypointTempId: match.id,
                  destinationWaypointId: null,
                })
              } else {
                onUpdate({
                  destinationWaypointId: match.id,
                  destinationWaypointTempId: null,
                })
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
