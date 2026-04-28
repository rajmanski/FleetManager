import { Truck, Tag, DollarSign, Calendar } from 'lucide-react'
import type { Cost } from '@/hooks/costs/useCosts'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { EntityCellLink } from '@/components/ui/EntityCellLink'
import { ThWithIcon } from '@/components/ui/ThWithIcon'
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
}

const formatAmount = (value: number) =>
  value.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export function CostsTable({ rows, page, total, pagination, vehicleLabelsById }: CostsTableProps) {
  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <ThWithIcon icon={Truck}>Vehicle</ThWithIcon>
                <ThWithIcon icon={Tag}>Category</ThWithIcon>
                <ThWithIcon icon={DollarSign}>Amount (PLN)</ThWithIcon>
                <ThWithIcon icon={Calendar}>Date</ThWithIcon>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((row) => (
                <tr key={row.id} className="bg-white">
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

