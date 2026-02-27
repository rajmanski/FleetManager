import { VEHICLE_STATUSES } from '@/constants/vehicleStatuses'
import { FilterCheckbox } from '@/components/ui/FilterCheckbox'
import { FilterRowsSelect } from '@/components/ui/FilterRowsSelect'
import { FilterSearchInput } from '@/components/ui/FilterSearchInput'
import { FilterSelect } from '@/components/ui/FilterSelect'
import type { PaginationHelpers } from '@/hooks/usePagination'

type VehiclesFiltersBarProps = {
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  search: string
  onSearchChange: (value: string) => void
  limit: number
  showDeleted: boolean
  onShowDeletedChange: (value: boolean) => void
  pagination: PaginationHelpers
  isAdmin: boolean
}

export function VehiclesFiltersBar({
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  limit,
  showDeleted,
  onShowDeletedChange,
  pagination,
  isAdmin,
}: VehiclesFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <FilterSelect
        label="Status"
        value={statusFilter}
        onChange={onStatusFilterChange}
        options={VEHICLE_STATUSES}
      />
      <FilterSearchInput
        label="Search"
        value={search}
        onChange={onSearchChange}
        placeholder="Search by VIN or brand"
      />
      <FilterRowsSelect value={limit} onChange={pagination.handleLimitChange} />
      {isAdmin && (
        <FilterCheckbox
          checked={showDeleted}
          onChange={onShowDeletedChange}
          label="Show deleted"
          onToggle={pagination.resetPage}
        />
      )}
    </div>
  )
}
