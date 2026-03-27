import { FilterRowsSelect } from '@/components/ui/FilterRowsSelect'
import { FilterSelect } from '@/components/ui/FilterSelect'
import type { PaginationHelpers } from '@/hooks/usePagination'

const COST_CATEGORIES = ['Tolls', 'Other'] as const

type CostsFiltersBarProps = {
  vehicleFilter: string
  onVehicleFilterChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  vehicleOptions: ReadonlyArray<{ value: string; label: string }>
  limit: number
  pagination: PaginationHelpers
}

export function CostsFiltersBar({
  vehicleFilter,
  onVehicleFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  vehicleOptions,
  limit,
  pagination,
}: CostsFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <FilterSelect
        label="Vehicle"
        value={vehicleFilter}
        onChange={onVehicleFilterChange}
        options={vehicleOptions}
      />

      <FilterSelect
        label="Category"
        value={categoryFilter}
        onChange={onCategoryFilterChange}
        options={COST_CATEGORIES}
      />

      <FilterRowsSelect value={limit} onChange={pagination.handleLimitChange} />
    </div>
  )
}

