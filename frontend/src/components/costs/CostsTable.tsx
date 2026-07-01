import { Truck, Tag, DollarSign, Calendar } from 'lucide-react'
import type { Cost } from '@/hooks/costs/useCosts'
import type { PaginationHelpers } from '@/hooks/usePagination'
import type { SortConfig } from '@/components/ui/SortableTh'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { EntityCellLink } from '@/components/ui/EntityCellLink'
import { ThWithIcon } from '@/components/ui/ThWithIcon'
import { SortableTh } from '@/components/ui/SortableTh'
import { formatDateOnly } from '@/utils/date'

type CostsTableProps = {
  rows: Cost[]
  page: number
  total: number
  pagination: Pick<
    PaginationHelpers,
    'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'
  >
  vehicleLabelsById: Record<number, string>
  sortConfig: SortConfig
  onSort: (column: string) => void
}

const formatAmount = (value: number) =>
  value.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export function CostsTable({ rows, page, total, pagination, vehicleLabelsById, sortConfig, onSort }: CostsTableProps) {
  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <SortableTh column="vehicleId" sortConfig={sortConfig} onSort={onSort} icon={Truck}>Vehicle</SortableTh>
                <SortableTh column="category" sortConfig={sortConfig} onSort={onSort} icon={Tag}>Category</SortableTh>
                <SortableTh column="amount" sortConfig={sortConfig} onSort={onSort} icon={DollarSign}>Amount (PLN)</SortableTh>
                <SortableTh column="date" sortConfig={sortConfig} onSort={onSort} icon={Calendar}>Date</SortableTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <EntityCellLink to={`/vehicles/${row.vehicleId}`}>
                      {vehicleLabelsById[row.vehicleId] ?? `#${row.vehicleId}`}
                    </EntityCellLink>
                  </td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3">{formatAmount(row.amount)}</td>
                  <td className="px-4 py-3">{formatDateOnly(row.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DataTablePagination>
  )
}

