import { FilterRowsSelect } from '@/components/ui/FilterRowsSelect'
import { FilterSearchInput } from '@/components/ui/FilterSearchInput'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { filterDateControlClassName } from '@/constants/inputStyles'
import type { PaginationHelpers } from '@/hooks/usePagination'

const CHANGELOG_OPERATIONS = ['INSERT', 'UPDATE', 'DELETE'] as const

type ChangelogFiltersBarProps = {
  userIdFilter: string
  onUserIdFilterChange: (value: string) => void
  tableNameFilter: string
  onTableNameFilterChange: (value: string) => void
  operationFilter: string
  onOperationFilterChange: (value: string) => void
  dateFromFilter: string
  onDateFromFilterChange: (value: string) => void
  dateToFilter: string
  onDateToFilterChange: (value: string) => void
  limit: number
  pagination: PaginationHelpers
}

export function ChangelogFiltersBar({
  userIdFilter,
  onUserIdFilterChange,
  tableNameFilter,
  onTableNameFilterChange,
  operationFilter,
  onOperationFilterChange,
  dateFromFilter,
  onDateFromFilterChange,
  dateToFilter,
  onDateToFilterChange,
  limit,
  pagination,
}: ChangelogFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <FilterSearchInput
        label="User ID"
        value={userIdFilter}
        onChange={onUserIdFilterChange}
        placeholder="e.g. 12"
      />

      <FilterSearchInput
        label="Table"
        value={tableNameFilter}
        onChange={onTableNameFilterChange}
        placeholder="e.g. vehicles"
      />

      <FilterSelect
        label="Operation"
        value={operationFilter}
        onChange={onOperationFilterChange}
        options={CHANGELOG_OPERATIONS}
      />

      <div className="min-w-0 sm:min-w-40">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Date from
        </label>
        <input
          type="date"
          value={dateFromFilter}
          onChange={(e) => onDateFromFilterChange(e.target.value)}
          className={filterDateControlClassName(dateFromFilter)}
        />
      </div>

      <div className="min-w-0 sm:min-w-40">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Date to
        </label>
        <input
          type="date"
          value={dateToFilter}
          onChange={(e) => onDateToFilterChange(e.target.value)}
          className={filterDateControlClassName(dateToFilter)}
        />
      </div>

      <FilterRowsSelect value={limit} onChange={pagination.handleLimitChange} />
    </div>
  )
}
