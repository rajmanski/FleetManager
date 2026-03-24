import { FilterRowsSelect } from '@/components/ui/FilterRowsSelect'
import { FilterSelect } from '@/components/ui/FilterSelect'
import type { PaginationHelpers } from '@/hooks/usePagination'

type FuelFiltersBarProps = {
  vehicleFilter: string
  onVehicleFilterChange: (value: string) => void
  dateFrom: string
  onDateFromChange: (value: string) => void
  dateTo: string
  onDateToChange: (value: string) => void
  vehicleOptions: ReadonlyArray<{ value: string; label: string }>
  limit: number
  pagination: PaginationHelpers
}

export function FuelFiltersBar({
  vehicleFilter,
  onVehicleFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  vehicleOptions,
  limit,
  pagination,
}: FuelFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <FilterSelect
        label="Vehicle"
        value={vehicleFilter}
        onChange={onVehicleFilterChange}
        options={vehicleOptions}
      />

      <div className="min-w-44">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Date from
        </label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="min-w-44">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Date to
        </label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <FilterRowsSelect value={limit} onChange={pagination.handleLimitChange} />
    </div>
  )
}

