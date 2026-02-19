import { PAGINATION_LIMITS } from '@/constants/pagination'
import { DRIVER_STATUSES } from '@/constants/driverStatuses'

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
  pagination,
  isAdmin,
}: DriversFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="min-w-44">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {DRIVER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-56 flex-1">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Search
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or PESEL"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="min-w-32">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Rows
        </label>
        <select
          value={limit}
          onChange={(e) => pagination.handleLimitChange(Number(e.target.value))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {PAGINATION_LIMITS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {isAdmin && (
        <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => {
              onShowDeletedChange(e.target.checked)
              pagination.resetPage()
            }}
          />
          Show deleted
        </label>
      )}
    </div>
  )
}
