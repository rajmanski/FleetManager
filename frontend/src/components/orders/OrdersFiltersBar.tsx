import { FilterRowsSelect } from '@/components/ui/FilterRowsSelect'
import { FilterSearchInput } from '@/components/ui/FilterSearchInput'
import { FilterSelect } from '@/components/ui/FilterSelect'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { ORDER_STATUSES } from '@/constants/orders'

type OrdersFiltersBarProps = {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  limit: number
  pagination: PaginationHelpers
}

export function OrdersFiltersBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  limit,
  pagination,
}: OrdersFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <FilterSearchInput
        label="Search"
        value={search}
        onChange={onSearchChange}
        placeholder="Search by client name or NIP"
      />
      <FilterSelect
        label="Status"
        value={status}
        onChange={(v) => {
          onStatusChange(v)
          pagination.resetPage()
        }}
        options={ORDER_STATUSES}
      />
      <FilterRowsSelect value={limit} onChange={pagination.handleLimitChange} />
    </div>
  )
}
