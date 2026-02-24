import { DRIVER_STATUS_OPTIONS } from '@/constants/driverStatuses'
import { FilterCheckbox } from '@/components/ui/FilterCheckbox'
import { FilterRowsSelect } from '@/components/ui/FilterRowsSelect'
import { FilterSearchInput } from '@/components/ui/FilterSearchInput'
import { FilterSelect } from '@/components/ui/FilterSelect'

type PaginationHelpers = {
  resetPage: () => void
  handleLimitChange: (value: number) => void
}

type DriversFiltersBarProps = {
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  search: string
  onSearchChange: (value: string) => void
  limit: number
  showDeleted: boolean
  onShowDeletedChange: (value: boolean) => void
  validCertificatesOnly: boolean
  onValidCertificatesOnlyChange: (value: boolean) => void
  pagination: PaginationHelpers
  isAdmin: boolean
}

export function DriversFiltersBar({
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  limit,
  showDeleted,
  onShowDeletedChange,
  validCertificatesOnly,
  onValidCertificatesOnlyChange,
  pagination,
  isAdmin,
}: DriversFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <FilterSelect
        label="Status"
        value={statusFilter}
        onChange={onStatusFilterChange}
        options={DRIVER_STATUS_OPTIONS}
      />
      <FilterSearchInput
        label="Search"
        value={search}
        onChange={onSearchChange}
        placeholder="Search by name or PESEL"
      />
      <FilterRowsSelect value={limit} onChange={pagination.handleLimitChange} />
      <FilterCheckbox
        checked={validCertificatesOnly}
        onChange={onValidCertificatesOnlyChange}
        label="Show only drivers with valid certificates"
        onToggle={pagination.resetPage}
      />
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
