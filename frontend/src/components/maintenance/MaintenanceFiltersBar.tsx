import { FilterRowsSelect } from '@/components/ui/FilterRowsSelect'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { MAINTENANCE_STATUSES } from '@/constants/maintenanceStatuses'
import type { PaginationHelpers } from '@/hooks/usePagination'

type MaintenanceFiltersBarProps = {
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  vehicleFilter: string
  onVehicleFilterChange: (value: string) => void
  vehicleOptions: ReadonlyArray<{ value: string; label: string }>
  limit: number
  pagination: PaginationHelpers
}

export function MaintenanceFiltersBar({
  statusFilter,
  onStatusFilterChange,
  vehicleFilter,
  onVehicleFilterChange,
  vehicleOptions,
  limit,
  pagination,
}: MaintenanceFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <FilterSelect
        label="Status"
        value={statusFilter}
        onChange={onStatusFilterChange}
        options={MAINTENANCE_STATUSES}
      />
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

