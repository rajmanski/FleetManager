import { TRIP_STATUSES } from '@/constants/tripStatuses'
import { FilterRowsSelect } from '@/components/ui/FilterRowsSelect'
import { FilterSearchInput } from '@/components/ui/FilterSearchInput'
import { FilterSelect } from '@/components/ui/FilterSelect'
import type { PaginationHelpers } from '@/hooks/usePagination'

type TripsFiltersBarProps = {
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  search: string
  onSearchChange: (value: string) => void
  limit: number
  pagination: PaginationHelpers
}

export function TripsFiltersBar({
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  limit,
  pagination,
}: TripsFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <FilterSelect
        label="Status"
        value={statusFilter}
        onChange={onStatusFilterChange}
        options={TRIP_STATUSES}
      />
      <FilterSearchInput
        label="Search"
        value={search}
        onChange={onSearchChange}
        placeholder="Search by order, VIN or driver"
      />
      <FilterRowsSelect value={limit} onChange={pagination.handleLimitChange} />
    </div>
  )
}

