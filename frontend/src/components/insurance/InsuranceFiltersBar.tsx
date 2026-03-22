import { FilterRowsSelect } from '@/components/ui/FilterRowsSelect'
import { FilterSelect } from '@/components/ui/FilterSelect'
import type { PaginationHelpers } from '@/hooks/usePagination'

type InsuranceFiltersBarProps = {
  vehicleFilter: string
  onVehicleFilterChange: (value: string) => void
  vehicleOptions: ReadonlyArray<{ value: string; label: string }>
  limit: number
  pagination: PaginationHelpers
}

export function InsuranceFiltersBar({
  vehicleFilter,
  onVehicleFilterChange,
  vehicleOptions,
  limit,
  pagination,
}: InsuranceFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <FilterSelect
        label="Vehicle"
        value={vehicleFilter}
        onChange={onVehicleFilterChange}
        options={vehicleOptions}
      />
      <FilterRowsSelect value={limit} onChange={pagination.handleLimitChange} />
    </div>
  )
}
