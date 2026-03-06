import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import {
  INPUT_CLASS_COMPACT,
  INPUT_NUMERIC_CLASS,
  INPUT_NUMERIC_DECIMAL_CLASS,
} from '@/constants/inputStyles'
import { CARGO_TYPES, type CargoItemDraft, type CargoType } from '@/schemas/cargo'
import { Trash2 } from 'lucide-react'
import type { CargoItemErrors } from '@/utils/cargo'

export type WaypointOption = {
  id: number
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
      <div className="flex flex-wrap items-end gap-2">
        <FormField label="Qty" required error={errors.quantity} className="shrink-0">
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onUpdate({ quantity: e.target.value })}
            placeholder="1"
            className={INPUT_NUMERIC_CLASS}
          />
        </FormField>
        <FormField
          label="Vol. (m³)"
          required
          error={errors.volumePerUnitM3}
          className="shrink-0"
        >
          <input
            type="number"
            step="1"
            min="0"
            value={item.volumePerUnitM3}
            onChange={(e) => onUpdate({ volumePerUnitM3: e.target.value })}
            placeholder="0"
            className={INPUT_NUMERIC_DECIMAL_CLASS}
          />
        </FormField>
        <FormField
          label="Weight (kg)"
          required
          error={errors.weightPerUnitKg}
          className="shrink-0"
        >
          <input
            type="number"
            step="1"
            min="0"
            value={item.weightPerUnitKg}
            onChange={(e) => onUpdate({ weightPerUnitKg: e.target.value })}
            placeholder="0"
            className={INPUT_NUMERIC_DECIMAL_CLASS}
          />
        </FormField>
        <FormField label="Type" required className="shrink-0">
          <select
            value={item.cargoType}
            onChange={(e) => onUpdate({ cargoType: e.target.value as CargoType })}
            className={`${INPUT_CLASS_COMPACT} min-w-[6rem]`}
          >
            {CARGO_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Description" error={undefined} className="min-w-0 flex-1">
          <input
            type="text"
            value={item.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="e.g. Palety z elektroniką"
            className={INPUT_CLASS_COMPACT}
          />
        </FormField>
      </div>
      {dropoffOptions.length > 0 && (
        <div className="mt-2">
          <FormField label="Dropoff point (optional)">
            <select
              value={item.destinationWaypointId ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onUpdate({
                  destinationWaypointId: v === '' ? null : parseInt(v, 10),
                })
              }}
              className={INPUT_CLASS_COMPACT}
            >
              <option value="">No specific point</option>
              {dropoffOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.address}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      )}
    </div>
  )
}
