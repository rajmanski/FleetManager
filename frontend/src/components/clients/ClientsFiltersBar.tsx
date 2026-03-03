import { FilterCheckbox } from '@/components/ui/FilterCheckbox'
import { FilterRowsSelect } from '@/components/ui/FilterRowsSelect'
import { FilterSearchInput } from '@/components/ui/FilterSearchInput'
import type { PaginationHelpers } from '@/hooks/usePagination'

type ClientsFiltersBarProps = {
  search: string
  onSearchChange: (value: string) => void
  limit: number
  showDeleted: boolean
  onShowDeletedChange: (value: boolean) => void
  pagination: PaginationHelpers
  isAdmin: boolean
}

export function ClientsFiltersBar({
  search,
  onSearchChange,
  limit,
  showDeleted,
  onShowDeletedChange,
  pagination,
  isAdmin,
}: ClientsFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <FilterSearchInput
        label="Search"
        value={search}
        onChange={onSearchChange}
        placeholder="Search by company name or NIP"
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

